import { NextResponse } from "next/server";
import { sendGiftCardEmails } from "@/lib/gift-card-mail";
import { giftCardsByToken, issueGiftCards } from "@/lib/gift-cards";
import { getOrder, markStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/gift-cards/issue  { token }
 * The shop's "Payment received. Create the gift card." The token comes from the
 * shop's own order email and is the only key to this: it is random, it is in
 * no page the customer sees, and it does nothing until this is POSTed, so a
 * mail app that opens links to preview them cannot press the button.
 *
 * Safe to press twice: the codes are made once and mailed once.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "invalid request" }, { status: 415 });
  }
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token.slice(0, 100) : "";
  const pending = token ? await giftCardsByToken(token) : [];
  if (!pending.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  const order = await getOrder(pending[0].order_number);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "cancelled", message: "This order was cancelled, so its gift card can't be created." }, { status: 409 });
  }

  const cards = await issueGiftCards(token);
  // the payment is what was just confirmed, so the order says so too
  if (order.status === "awaiting_payment" || order.status === "payment_submitted") {
    await markStatus(order.number, "confirmed", "payment confirmed, gift card created");
  }
  const mail = await sendGiftCardEmails(order, cards, 1);
  return NextResponse.json({ ok: true, failed: mail.failed });
}
