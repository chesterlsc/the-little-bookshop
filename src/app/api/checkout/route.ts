import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { hasGiftCard, isDigitalOnly, type Cart } from "@/lib/cart";
import {
  buildSnapshot,
  EMPTY_CUSTOMER,
  normalizeInstagram,
  pendingGiftCards,
  validateCustomer,
  withGiftCard,
  type CustomerInfo,
} from "@/lib/checkout";
import { GIFT_ON_GIFT, giftCardProblem, giftCardState, normalizeGiftCode } from "@/lib/gift-card-types";
import {
  createPendingGiftCards,
  giftCardByCode,
  recordGiftCardUse,
  redeemGiftCard,
  refundGiftCard,
} from "@/lib/gift-cards";
import { GIFT_SLOW, giftGuessThrottled } from "@/lib/gift-throttle";
import { createOrder, getOrder, markStatus, parseSnapshot } from "@/lib/orders";
import { notifyNewOrder } from "@/lib/notify-order";
import { toPaySnapshot } from "@/lib/pay-snapshot";

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

/**
 * The shop's notification is the order record, so a send failure must reach the
 * customer rather than being logged into the void: they retry, and the shop
 * hears about the order. `claimEmailSend` keeps an ordinary retry to one email.
 */
function emailFailed(orderNumber: string, err: unknown) {
  console.error(`[checkout] order ${orderNumber} could not be emailed:`, err);
  return NextResponse.json(
    {
      error: "email",
      message: `We saved your order (${orderNumber}) but couldn't send the confirmation. Nothing was charged. Please press Place order again, or message us on Instagram with that number.`,
    },
    { status: 502 },
  );
}

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
 * a screenshot on Instagram. The one thing this endpoint does spend is a gift
 * card's balance, taken in a single conditional update before the order is
 * saved and put back if the save fails.
 */
export async function POST(request: Request) {
  // JSON only: a cross-site form or text/plain fetch cannot reach the send.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "invalid request" }, { status: 415 });
  }
  let body: {
    cart?: Cart;
    customer?: Partial<CustomerInfo>;
    idempotencyKey?: string;
    discountCode?: string;
    giftCardCode?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const clientKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 100) : "";

  const cart = body.cart;
  if (!cart || !Array.isArray(cart.lines) || !cart.lines.every((l) => l && typeof l === "object")) {
    return NextResponse.json({ error: "invalid cart" }, { status: 400 });
  }

  // a basket of gift cards is posted nowhere, so it is not asked for an address
  const fieldErrors = validateCustomer(body.customer ?? {}, isDigitalOnly(cart));
  if (Object.keys(fieldErrors).length) {
    return NextResponse.json({ error: "customer", fieldErrors }, { status: 422 });
  }
  // Built on EMPTY_CUSTOMER so every field is a string even when the request
  // omits an optional one; the normalizers below all assume that.
  const customer: CustomerInfo = {
    ...EMPTY_CUSTOMER,
    ...Object.fromEntries(
      Object.entries(body.customer as CustomerInfo).map(([k, v]) => [k, String(v ?? "").trim()]),
    ),
  };
  customer.instagram = normalizeInstagram(customer.instagram);

  // The code only names a discount; the amount is computed here, never trusted.
  const discountCode = typeof body.discountCode === "string" ? body.discountCode : undefined;
  const { snapshot, issues } = buildSnapshot({ lines: cart.lines }, customer, discountCode);
  if (!snapshot) {
    return NextResponse.json({ error: "cart", issues }, { status: 422 });
  }

  const giftRefusal = (message: string, status = 409) =>
    NextResponse.json({ error: "giftCard", message }, { status });
  const giftCode = normalizeGiftCode(body.giftCardCode);
  if (typeof body.giftCardCode === "string" && body.giftCardCode.trim() && !giftCode) {
    return giftRefusal(giftCardProblem({ status: "unknown" }));
  }
  if (giftCode && hasGiftCard(cart)) return giftRefusal(GIFT_ON_GIFT);

  // Checked after the snapshot exists, so a repeat only collapses into the
  // earlier order when it is genuinely the same order. Taken before the gift
  // card is spent: a retry sees a smaller balance, and must still be a retry.
  const key = clientKey ? fingerprint(clientKey, { snapshot, giftCode }) : "";
  if (key) {
    const seen = recent.get(key);
    if (seen && Date.now() - seen.at < IDEMPOTENCY_WINDOW_MS) {
      const existing = await getOrder(seen.number);
      if (existing) {
        // A retry after a failed send lands here, so this must send too.
        try {
          await notifyNewOrder(existing.number);
        } catch (err) {
          return emailFailed(existing.number, err);
        }
        return NextResponse.json({
          orderNumber: existing.number,
          pay: toPaySnapshot(existing.number, parseSnapshot(existing)),
          reused: true,
        });
      }
    }
  }

  // The card is looked up and spent here, never trusted from the browser: the
  // amount is whatever is really on it, capped at what the order really costs.
  let priced = snapshot;
  if (giftCode) {
    // placing an order is also a way to try a code, so it counts as a try
    if (giftGuessThrottled(request)) return giftRefusal(GIFT_SLOW, 429);
    const state = giftCardState(await giftCardByCode(giftCode));
    if (state.status !== "ok") return giftRefusal(giftCardProblem(state));
    priced = withGiftCard(snapshot, giftCode, state.balance);
    if (priced.giftCard && !(await redeemGiftCard(giftCode, priced.giftCard.applied))) {
      return giftRefusal("That card's balance just changed. Press Use card again to see what's on it.");
    }
  }
  const spent = priced.giftCard?.applied ?? 0;

  let order;
  try {
    order = await createOrder(priced);
    const pending = pendingGiftCards(cart);
    // saved with the order, with no code: the shop makes that once it is paid
    if (pending.length) await createPendingGiftCards(order.number, randomBytes(24).toString("base64url"), pending);
  } catch (err) {
    console.error("[checkout] could not save the order:", err);
    if (spent) await refundGiftCard(giftCode, spent).catch((e) => console.error(`[checkout] could not put ${spent} back on a gift card:`, e));
    return NextResponse.json(
      {
        error: "save",
        message: "We couldn't save your order just now. Nothing was charged. Please try again in a moment.",
      },
      { status: 500 },
    );
  }

  if (key) remember(key, order.number);
  if (spent) {
    // the order's own snapshot already records this; the ledger is for the shop's books
    await recordGiftCardUse(giftCode, order.number, spent).catch((e) => console.error(`[order ${order.number}] gift card use not recorded:`, e));
    // nothing left to transfer, so there is no screenshot to wait for
    if (priced.total === 0) await markStatus(order.number, "confirmed", "paid in full by gift card");
  }
  try {
    await notifyNewOrder(order.number);
  } catch (err) {
    return emailFailed(order.number, err);
  }

  return NextResponse.json({ orderNumber: order.number, pay: toPaySnapshot(order.number, priced) });
}
