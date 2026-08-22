import { NextResponse } from "next/server";
import { getOrder, markStatus, setProviderStatus } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";
import { finalizePaidOrder } from "@/lib/finalize-order";

export const runtime = "nodejs";

/**
 * GET /api/payments/verify?order=LB-…
 * Server-side verification with the provider. Landing on a success URL is
 * never proof of payment; this endpoint (or the webhook) is.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const number = url.searchParams.get("order") ?? "";
  const order = getOrder(number);
  if (!order) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ status: "paid", orderNumber: order.number });
  }

  const provider = getPaymentProvider();
  try {
    const result = await provider.verifyPayment(order);
    if (result.state === "paid") {
      await finalizePaidOrder(order.number, result.reference);
      return NextResponse.json({ status: "paid", orderNumber: order.number });
    }
    if (result.state === "failed") {
      markStatus(order.number, "failed", result.reference);
      return NextResponse.json({ status: "failed", orderNumber: order.number });
    }
    if (result.state === "cancelled") {
      markStatus(order.number, "cancelled", result.reference);
      return NextResponse.json({ status: "cancelled", orderNumber: order.number });
    }
    setProviderStatus(order.number, result.reference);
    return NextResponse.json({ status: "pending", orderNumber: order.number });
  } catch (err) {
    console.error(`[order ${order.number}] verification error:`, err);
    return NextResponse.json({ status: "pending", orderNumber: order.number, note: "verify-error" });
  }
}
