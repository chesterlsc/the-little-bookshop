import { NextResponse } from "next/server";
import { getOrder, markStatus } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";
import { finalizePaidOrder } from "@/lib/finalize-order";

export const runtime = "nodejs";

/**
 * POST /api/payments/webhook
 * The provider's server-to-server confirmation. Signatures are verified by
 * the provider adapter; unsigned or malformed events are rejected.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const provider = getPaymentProvider();

  let result;
  try {
    result = await provider.parseWebhook(rawBody, request.headers);
  } catch (err) {
    console.error("[webhook] rejected:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "invalid-signature" }, { status: 400 });
  }

  if (!result) return NextResponse.json({ received: true, ignored: true });

  const order =
    (result.orderNumber && getOrder(result.orderNumber)) || null;
  if (!order) {
    // acknowledge so the provider stops retrying an event we can't match
    console.warn("[webhook] no matching order for", result.orderNumber ?? result.providerRef);
    return NextResponse.json({ received: true, matched: false });
  }

  if (result.state === "paid") {
    await finalizePaidOrder(order.number, result.reference);
  } else if (result.state === "failed") {
    markStatus(order.number, "failed", result.reference);
  } else if (result.state === "cancelled") {
    markStatus(order.number, "cancelled", result.reference);
  }
  return NextResponse.json({ received: true });
}
