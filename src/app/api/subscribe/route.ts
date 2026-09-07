import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/email";
import {
  SUBSCRIBE_SOURCES,
  subscriberNoticeEmail,
  welcomeCodeEmail,
  type SubscribeSource,
} from "@/lib/email/templates";
import { ordersAddress } from "@/lib/email/types";
import { WELCOME_CODE } from "@/lib/discount";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Recent signups per address, so one person cannot burn the mail quota or
 * fill the shop inbox by leaning on the button. In-memory and per instance,
 * which is enough to blunt a casual loop.
 * ponytail: promote to a shared store if this ever sees real abuse.
 */
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 5;

function throttled(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear(); // never let a flood grow the map unbounded
  return hits.length > PER_WINDOW;
}

/**
 * POST /api/subscribe
 * The welcome popup: an email address and where they found us, in exchange
 * for the welcome code. The code is fixed and public, so the only thing this
 * endpoint guards is the shop's mail quota.
 *
 * Two emails go out: the code to the customer, which also proves the address
 * is real, and a one-line notice to the shop, whose inbox is the mailing list.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    source?: string;
    /** honeypot: real people never fill this */
    website?: string;
  } | null;

  if (body?.website) return NextResponse.json({ ok: true, code: WELCOME_CODE }); // quiet bot trap

  const email = (body?.email ?? "").trim().toLowerCase().slice(0, 200);
  const source = (SUBSCRIBE_SOURCES as readonly string[]).includes(body?.source ?? "")
    ? (body!.source as SubscribeSource)
    : "other";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "email", message: "That email address doesn't look right." },
      { status: 422 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) {
    return NextResponse.json(
      { error: "slow", message: "Give us a moment and try again." },
      { status: 429 },
    );
  }

  const mailer = getEmailProvider();
  try {
    // The customer's copy first: if their address bounces, the shop should
    // not be told about a subscriber who cannot be reached.
    await mailer.send(welcomeCodeEmail(email));
  } catch (err) {
    console.error("[subscribe] could not send the code:", err);
    return NextResponse.json(
      { error: "send", message: "We couldn't send your code just now. Please try again in a moment." },
      { status: 502 },
    );
  }
  try {
    await mailer.send(subscriberNoticeEmail(ordersAddress(), email, source));
  } catch (err) {
    // They have their code; the shop missing one notice is not worth failing them for.
    console.error("[subscribe] shop notice failed:", err);
  }

  return NextResponse.json({ ok: true, code: WELCOME_CODE });
}
