import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/email";
import { paymentProofEmail } from "@/lib/email/templates";
import { ordersAddress } from "@/lib/email/types";
import { baseUrl } from "@/lib/notify-order";
import { claimPaymentProof, getOrder, parseSnapshot, releasePaymentProof } from "@/lib/orders";

export const runtime = "nodejs";
/** A phone on a slow connection, plus the mailer's own ten seconds. */
export const maxDuration = 60;

/** Our own cap, well under Vercel's uncatchable 4.5MB, so the customer sees our words. */
const MAX_BODY = 2_000_000;
const MAX_IMAGE = 1_500_000;
const JPEG = "data:image/jpeg;base64,";

const INSTAGRAM_FALLBACK = "Please send it to us on Instagram instead.";

/**
 * Uploads per address, so nobody pays us to parse megabytes for fun. The real
 * protection against a burst of email is the claim below, which caps an order
 * at three sends whatever happens here.
 * ponytail: in-memory per instance, same bar as the signup throttle.
 */
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 6;

function throttled(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > PER_WINDOW;
}

/**
 * POST /api/orders/<number>/payment-proof
 *
 * The customer's payment screenshot, as a JSON data URL rather than a file
 * upload: JSON is what makes a cross-site POST fail its preflight, which is
 * the same gate every other route here relies on.
 *
 * The order moves to `payment_submitted` and the shop is emailed the image.
 * Nothing here confirms an order: the shop still checks the transfer by hand.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/orders/[number]/payment-proof">,
) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "invalid request" }, { status: 415 });
  }
  // Refuse the big ones before reading a byte of them.
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return NextResponse.json(
      { error: "too big", message: `That image is too large. ${INSTAGRAM_FALLBACK}` },
      { status: 413 },
    );
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) {
    return NextResponse.json(
      { error: "slow", message: "Give us a moment and try again." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    image?: string;
    method?: string;
  } | null;
  const image = body?.image ?? "";
  if (!image.startsWith(JPEG)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const base64 = image.slice(JPEG.length);
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > MAX_IMAGE) {
    return NextResponse.json(
      { error: "too big", message: `That image is too large. ${INSTAGRAM_FALLBACK}` },
      { status: 413 },
    );
  }
  // The browser re-encodes every screenshot to JPEG, so anything else is not
  // the file it claims to be.
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const { number } = await ctx.params;
  const orderNumber = decodeURIComponent(number);
  const order = await getOrder(orderNumber);
  if (!order) {
    return NextResponse.json(
      { error: "not found", message: "We couldn't find that order number." },
      { status: 404 },
    );
  }

  const method = (body?.method ?? "").trim().slice(0, 40) || "not said";
  // One statement moves the order and buys the right to send this email.
  if (!(await claimPaymentProof(order.number, method))) {
    return NextResponse.json(
      {
        error: "status",
        message:
          "We already have your screenshot for this order. If you need to send a corrected one, message us on Instagram.",
      },
      { status: 409 },
    );
  }

  try {
    await getEmailProvider().send(
      paymentProofEmail(
        ordersAddress(),
        order.number,
        parseSnapshot(order),
        method,
        `${baseUrl()}/order/${order.number}`,
        base64.replace(/\s+/g, ""),
      ),
    );
  } catch (err) {
    console.error(`[order ${order.number}] payment screenshot not sent:`, err);
    await releasePaymentProof(order.number);
    return NextResponse.json(
      {
        error: "send",
        message: `We couldn't send your screenshot just now. Nothing is lost — please try again, or send it to us on Instagram.`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
