import { NextResponse } from "next/server";
import { giftCardProblem, giftCardState, normalizeGiftCode } from "@/lib/gift-card-types";
import { giftCardByCode } from "@/lib/gift-cards";
import { GIFT_SLOW, giftGuessThrottled } from "@/lib/gift-throttle";

export const runtime = "nodejs";

/**
 * POST /api/gift-cards/check  { code }
 * What a card is worth right now, so the checkout can show it before the order
 * is placed. Only ever a preview: the checkout looks the card up again and
 * spends what is really there.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "invalid request" }, { status: 415 });
  }
  if (giftGuessThrottled(request)) {
    return NextResponse.json({ status: "slow", message: GIFT_SLOW }, { status: 429 });
  }
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const code = normalizeGiftCode(typeof body.code === "string" ? body.code : "");
  const state = giftCardState(code ? await giftCardByCode(code) : undefined);
  return NextResponse.json(state.status === "ok" ? { ...state, code } : { ...state, message: giftCardProblem(state) });
}
