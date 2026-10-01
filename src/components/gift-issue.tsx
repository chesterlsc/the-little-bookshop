"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { GiftCardReady, ResendGiftEmail, type GiftCardView } from "./gift-card-ready";
import { IconCheck } from "./icons";

const peso = (cents: number) => formatMoney(cents).replace(/\.00$/, "");

/**
 * The shop's one decision: has this payment arrived? Before, a summary and one
 * button in the thumb's reach. After, the code, where it was emailed, and the
 * ways to send it on by hand.
 */
export function GiftIssue({
  token,
  orderNumber,
  cancelled,
  toCheck,
  buyer,
  payingBy,
  screenshot,
  pending,
  made,
}: {
  token: string;
  orderNumber: string;
  cancelled: boolean;
  /** what the buyer has to transfer for this order */
  toCheck: number;
  buyer: { name: string; email: string; instagram: string };
  payingBy: string | null;
  screenshot: boolean;
  pending: { amount: number; delivery: "self" | "friend"; toName: string | null; toEmail: string | null }[];
  made: GiftCardView[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/gift-cards/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        router.refresh(); // the page reads the new codes from the database
        return;
      }
      setError((await res.json()).message ?? "That didn't go through. Nothing was created. Please try again.");
    } catch {
      setError("We couldn't reach the shop just now. Nothing was created. Please try again.");
    }
    setBusy(false);
  };

  const firstName = buyer.name.trim().split(/\s+/)[0] || "The buyer";
  const sendTo = (c: { delivery: "self" | "friend"; toName: string | null; toEmail: string | null }) =>
    c.delivery === "friend" ? { who: c.toName?.trim() || "their friend", email: c.toEmail ?? "" } : { who: firstName, email: buyer.email };
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-ink-600">{label}</dt>
      <dd className="text-right font-bold text-ink-900">{value}</dd>
    </div>
  );

  if (made.length > 0) {
    return (
      <div className="mt-6 text-center">
        <p className="eyebrow">
          {orderNumber} · {made.map((c) => peso(c.amount)).join(" + ")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold">{made.length > 1 ? "Gift cards created" : "Gift card created"}</h1>
        {made.map((c) => {
          const to = sendTo(c);
          return (
            <div key={c.code} className="mt-5">
              {c.emailedAt ? (
                <p className="mx-auto mb-4 flex max-w-sm items-start gap-2 rounded-2xl border-[1.5px] border-sage-600 bg-sage-100 px-3 py-2.5 text-left font-sans text-sm font-bold text-sage-800">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Emailed to {to.email}
                    {c.delivery === "friend" && <span className="block font-normal">{firstName} got a copy too.</span>}
                  </span>
                </p>
              ) : (
                <p className="mx-auto mb-4 max-w-sm rounded-2xl border-[1.5px] border-rose-500 bg-blush-100 px-3 py-2.5 text-left font-sans text-sm font-bold text-rose-700" role="alert">
                  We couldn&apos;t email {to.who}. Copy the code and send it on Instagram instead.
                </p>
              )}
              <GiftCardReady card={c} />
            </div>
          );
        })}
        <div className="mt-6 flex flex-col items-center gap-3">
          {buyer.instagram && (
            <a
              href={`https://ig.me/m/${encodeURIComponent(buyer.instagram)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full max-w-sm"
            >
              Open Instagram chat with @{buyer.instagram}
            </a>
          )}
          <ResendGiftEmail by={{ token }} />
        </div>
        <p className="mt-4 font-sans text-sm text-ink-600">{firstName} can already see this code on their order page.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-1 flex-col text-center">
      <p className="eyebrow">Private · for the shop</p>
      <h1 className="mt-1 font-display text-3xl font-bold">{orderNumber}</h1>

      <div className="clay mt-5 p-5 text-left">
        {pending.map((c, i) => {
          const to = sendTo(c);
          return (
            <div key={i} className={i > 0 ? "mt-4 border-t border-dashed border-taupe-300 pt-4" : ""}>
              <p className="font-sans text-sm text-ink-600">Gift card</p>
              <p className="font-display text-4xl font-bold leading-none text-ink-900">{peso(c.amount)}</p>
              <dl className="mt-2 font-sans text-[0.95rem]">
                {row(
                  "Send to",
                  <>
                    {to.who} · by email
                    <span className="block font-normal text-ink-600">{to.email}</span>
                  </>,
                )}
              </dl>
            </div>
          );
        })}
        <dl className="mt-3 border-t border-brown-500/15 pt-2 font-sans text-[0.95rem]">
          {row("Buyer", buyer.name)}
          {buyer.instagram && row("Instagram", `@${buyer.instagram}`)}
          {row("Paying by", payingBy ?? "GCash or MariBank")}
          {row("Screenshot", screenshot ? "Received" : "Not sent yet")}
          {row("To arrive", peso(toCheck))}
        </dl>
      </div>

      {cancelled ? (
        <p className="mt-5 font-sans text-[0.95rem] font-bold text-rose-700" role="alert">
          This order was cancelled, so its gift card can&apos;t be created.
        </p>
      ) : (
        <>
          <p className="mx-auto mt-5 max-w-[40ch] font-sans text-[0.95rem] leading-relaxed text-ink-600">
            Check that <strong className="text-ink-900">{peso(toCheck)}</strong> has arrived in{" "}
            {payingBy ?? "GCash or MariBank"} first. Pressing the button makes the code and emails it straight away.
          </p>
          {error && (
            <p className="mt-3 font-sans text-sm font-bold text-rose-700" role="alert">
              {error}
            </p>
          )}
          <div className="relative mt-auto pt-6">
            <button
              type="button"
              onClick={create}
              disabled={busy}
              className="cta-beacon flex min-h-[66px] w-full flex-col items-center justify-center px-4 py-2 font-display font-bold leading-tight text-ink-900 disabled:opacity-60"
            >
              {busy ? (
                "Creating the gift card…"
              ) : (
                <>
                  <span className="text-[1.15rem]">Payment received.</span>
                  <span className="text-[1.15rem]">Create the gift card.</span>
                </>
              )}
            </button>
            <p className="mt-4 font-sans text-sm text-ink-600">Not yet? Close this page. Nothing changes.</p>
          </div>
        </>
      )}
    </div>
  );
}
