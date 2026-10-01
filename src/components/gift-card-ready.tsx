"use client";

import { useState } from "react";
import { giftDate } from "@/lib/gift-card-types";
import { formatMoney } from "@/lib/money";
import { CopyButton } from "./copy-button";
import { GiftCardBack } from "./gift-card-art";
import { Button } from "./ui";

/** A made gift card, as the pages that show it need it: no token, no ids. */
export interface GiftCardView {
  code: string;
  amount: number;
  expiresAt: string;
  delivery: "self" | "friend";
  toName: string | null;
  fromName: string | null;
  toEmail: string | null;
  emailedAt: string | null;
}

/** "Send the email again": the buyer by order number, the shop by its private token. */
export function ResendGiftEmail({ by, className = "" }: { by: { order: string } | { token: string }; className?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const send = async () => {
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/gift-cards/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(by),
      });
      if (res.ok) {
        setState("sent");
        return;
      }
      setMessage((await res.json()).message ?? "We couldn't send that just now. Please try again.");
    } catch {
      setMessage("We couldn't send that just now. Please try again.");
    }
    setState("idle");
  };
  return (
    <div className={className}>
      <Button variant="quiet" onClick={send} disabled={state !== "idle"} className="!min-h-[44px] text-[0.9rem]">
        {state === "sent" ? "Sent again ✓" : state === "sending" ? "Sending…" : "Send the email again"}
      </Button>
      {message && (
        <p className="mt-2 font-sans text-sm font-bold text-rose-700" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * The card's back with its code written in, the code again as plain text
 * beside a Copy button, and what it is worth. The code is on the page from the
 * first frame; the little lift is decoration and never hides it.
 */
export function GiftCardReady({ card }: { card: GiftCardView }) {
  return (
    <div className="gift-reveal">
      <div className="mx-auto max-w-md drop-shadow-[0_14px_18px_rgba(67,54,42,0.22)]">
        <GiftCardBack
          code={card.code}
          toName={card.toName ?? undefined}
          fromName={card.fromName ?? undefined}
          sizes="(min-width:640px) 448px, 92vw"
        />
      </div>
      <div className="mx-auto mt-4 flex max-w-md items-center gap-2">
        <output
          aria-label="Gift card code"
          className="flex min-h-[44px] flex-1 select-all items-center justify-center rounded-2xl border-2 border-dashed border-rose-700 bg-blush-100 px-3 font-mono text-[1.05rem] font-bold tracking-wide text-ink-900"
        >
          {card.code}
        </output>
        <CopyButton value={card.code} label="gift card code" />
      </div>
      <p className="mt-2 text-center font-sans text-sm font-bold text-ink-800">
        {formatMoney(card.amount).replace(/\.00$/, "")} · Good until {giftDate(card.expiresAt)}
      </p>
    </div>
  );
}
