import { NextResponse } from "next/server";
import type { Cart } from "@/lib/cart";
import { buildSnapshot, validateCustomer, type CustomerInfo } from "@/lib/checkout";
import { createOrder, setProviderRef, markStatus } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * POST /api/checkout
 * 1. validate the cart + customer on the server (never trusting client prices)
 * 2. create a unique pending order
 * 3. create the hosted payment session and send the customer there
 */
export async function POST(request: Request) {
  let body: { cart?: Cart; customer?: Partial<CustomerInfo> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

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

  const { snapshot, issues } = buildSnapshot({ lines: cart.lines }, customer);
  if (!snapshot) {
    return NextResponse.json({ error: "cart", issues }, { status: 422 });
  }

  const provider = getPaymentProvider();
  const order = createOrder(snapshot, provider.id);

  try {
    const session = await provider.createCheckoutSession(order);
    setProviderRef(order.number, session.providerRef);
    return NextResponse.json({ orderNumber: order.number, redirectUrl: session.redirectUrl });
  } catch (err) {
    console.error(`[order ${order.number}] payment session failed:`, err);
    markStatus(order.number, "failed", "session-creation-failed");
    return NextResponse.json(
      { error: "payment", message: "We couldn't start the payment page. Nothing was charged. Please try again in a moment." },
      { status: 502 },
    );
  }
}
