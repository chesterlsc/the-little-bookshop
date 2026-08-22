import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/email";
import { contactEmail } from "@/lib/email/templates";
import { ordersAddress } from "@/lib/email/types";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    message?: string;
    /** honeypot: real people never fill this */
    website?: string;
  } | null;

  if (body?.website) return NextResponse.json({ ok: true }); // quiet bot trap

  const name = (body?.name ?? "").trim().slice(0, 120);
  const email = (body?.email ?? "").trim().slice(0, 200);
  const message = (body?.message ?? "").trim().slice(0, 4000);

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please add your name.";
  if (!EMAIL_RE.test(email)) errors.email = "That email address doesn't look right.";
  if (message.length < 5) errors.message = "Please add a message.";
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "validation", fieldErrors: errors }, { status: 422 });
  }

  try {
    await getEmailProvider().send(contactEmail(ordersAddress(), name, email, message));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] send failed:", err);
    return NextResponse.json(
      { error: "send", message: "We couldn't send that just now. Please try again, or email us directly." },
      { status: 502 },
    );
  }
}
