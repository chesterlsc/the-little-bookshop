import { NextResponse } from "next/server";
import { MAX_GIFT_EMAILS } from "@/lib/gift-card-types";
import { sendGiftCardEmails } from "@/lib/gift-card-mail";
import { giftCardsByOrder, giftCardsByToken } from "@/lib/gift-cards";
import { getOrder } from "@/lib/orders";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/gift-cards/resend  { token } | { order }
 * "Send the email again", from the shop's page (by token) or the buyer's order
 * page (by order number, the same key that opens that page). Each card can be
 * mailed MAX_GIFT_EMAILS times in all, so this cannot be leaned on to spend
 * the shop's mail quota.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "invalid request" }, { status: 415 });
  }
  let body: { token?: string; order?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const cards = (
    typeof body.token === "string"
      ? await giftCardsByToken(body.token.slice(0, 100))
      : typeof body.order === "string"
        ? await giftCardsByOrder(body.order.slice(0, 40))
        : []
  ).filter((c) => c.code);
  if (!cards.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  const order = await getOrder(cards[0].order_number);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  const mail = await sendGiftCardEmails(order, cards, MAX_GIFT_EMAILS);
  if (mail.failed.length) {
    return NextResponse.json(
      { error: "send", message: "We couldn't send that email just now. Copy the code and send it on Instagram instead." },
      { status: 502 },
    );
  }
  if (!mail.sent.length) {
    return NextResponse.json(
      { error: "limit", message: "That email has already gone out a few times. Copy the code and send it on Instagram instead." },
      { status: 429 },
    );
  }
  return NextResponse.json({ ok: true });
}
