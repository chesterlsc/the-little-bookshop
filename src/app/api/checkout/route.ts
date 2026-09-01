import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { Cart } from "@/lib/cart";
import {
  buildSnapshot,
  normalizeInstagram,
  validateCustomer,
  type CustomerInfo,
} from "@/lib/checkout";
import { createOrder, getOrder } from "@/lib/orders";
import { notifyNewOrder } from "@/lib/notify-order";

export const runtime = "nodejs";

/**
 * Recently created orders, keyed by the client's idempotency key.
 *
 * Guards the double-click / double-submit case: the same key inside the window
 * returns the order that was already created instead of making a second one.
 * ponytail: in-memory, so it does not survive a restart or span instances —
 * enough for one small shop. Move the key into an `orders` column if the site
 * ever runs more than one server process.
 */
const recent = new Map<string, { number: string; at: number }>();

/** The key alone is not enough: it must name the same order to be a retry. */
const fingerprint = (key: string, snapshot: unknown) =>
  `${key}:${createHash("sha256").update(JSON.stringify(snapshot)).digest("hex").slice(0, 32)}`;
const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000;

function remember(key: string, number: string) {
  const now = Date.now();
  for (const [k, v] of recent) if (now - v.at > IDEMPOTENCY_WINDOW_MS) recent.delete(k);
  recent.set(key, { number, at: now });
}

/**
 * POST /api/checkout
 * 1. validate the cart + customer on the server (client prices are never trusted)
 * 2. save the order as `awaiting_payment`
 * 3. email the shop and the customer
 *
 * There is no payment gateway: the customer pays by manual transfer and sends
 * a screenshot on Instagram, so this endpoint never moves money.
 */
export async function POST(request: Request) {
  let body: { cart?: Cart; customer?: Partial<CustomerInfo>; idempotencyKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const clientKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 100) : "";

  const cart = body.cart;
  if (!cart || !Array.isArray(cart.lines)) {
    return NextResponse.json({ error: "invalid cart" }, { status: 400 });
  }

  const fieldErrors = validateCustomer(body.customer ?? {});
  if (Object.keys(fieldErrors).length) {
    return NextResponse.json({ error: "customer", fieldErrors }, { status: 422 });
  }
  const customer = Object.fromEntries(
    Object.entries(body.customer as CustomerInfo).map(([k, v]) => [k, String(v ?? "").trim()]),
  ) as unknown as CustomerInfo;
  customer.instagram = normalizeInstagram(customer.instagram);

  const { snapshot, issues } = buildSnapshot({ lines: cart.lines }, customer);
  if (!snapshot) {
    return NextResponse.json({ error: "cart", issues }, { status: 422 });
  }

  // Checked after the snapshot exists, so a repeat only collapses into the
  // earlier order when it is genuinely the same order.
  const key = clientKey ? fingerprint(clientKey, snapshot) : "";
  if (key) {
    const seen = recent.get(key);
    if (seen && Date.now() - seen.at < IDEMPOTENCY_WINDOW_MS) {
      const existing = await getOrder(seen.number);
      if (existing) return NextResponse.json({ orderNumber: existing.number, reused: true });
    }
  }

  let order;
  try {
    order = await createOrder(snapshot);
  } catch (err) {
    console.error("[checkout] could not save the order:", err);
    return NextResponse.json(
      {
        error: "save",
        message: "We couldn't save your order just now. Nothing was charged. Please try again in a moment.",
      },
      { status: 500 },
    );
  }

  if (key) remember(key, order.number);
  // emails must never take the order down with them
  await notifyNewOrder(order.number);

  return NextResponse.json({ orderNumber: order.number });
}
