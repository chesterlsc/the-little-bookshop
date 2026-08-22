import { NextResponse } from "next/server";
import { devSetOutcome } from "@/lib/payments/dev";
import { isDevPayments } from "@/lib/payments";
import { getOrder } from "@/lib/orders";

export const runtime = "nodejs";

/**
 * POST /api/dev/pay: the simulator's buttons (development mode only).
 * Sets the simulated provider outcome; actual order finalization still goes
 * through /api/payments/verify, exactly like a real provider.
 */
export async function POST(request: Request) {
  if (!isDevPayments()) {
    return NextResponse.json({ error: "not-available" }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as {
    orderNumber?: string;
    outcome?: "paid" | "failed" | "cancelled";
  } | null;
  if (!body?.orderNumber || !body.outcome || !["paid", "failed", "cancelled"].includes(body.outcome)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const order = getOrder(body.orderNumber);
  if (!order) return NextResponse.json({ error: "not-found" }, { status: 404 });
  devSetOutcome(order.number, body.outcome);
  return NextResponse.json({ ok: true });
}
