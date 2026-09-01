"use client";

import { useState } from "react";
import { CopyButton } from "./copy-button";
import { Badge } from "./ui";
import { IconCheck } from "./icons";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, PAYMENT_METHODS } from "@/content/site";
import { formatMoney } from "@/lib/money";
import type { Cents } from "@/lib/money";

/** Plain digits, so pasting into a banking app never carries a peso sign. */
const plainAmount = (total: Cents) => (total / 100).toFixed(2);

function messageTemplate(order: string, name: string, total: Cents, method: string) {
  return [
    "Hi Little Bookshop! ♡",
    "I've completed payment for my order.",
    "",
    `Order: #${order}`,
    `Name: ${name}`,
    `Amount: ${formatMoney(total)}`,
    `Payment method: ${method}`,
    "",
    "I'll attach my payment screenshot here. Thank you!",
  ].join("\n");
}

/**
 * The manual payment screen: pick a method, copy the number and the exact
 * amount, then send a screenshot on Instagram. Nothing here can mark an order
 * paid — the shop verifies every transfer by hand.
 */
export function PaymentInstructions({
  orderNumber,
  customerName,
  total,
}: {
  orderNumber: string;
  customerName: string;
  total: Cents;
}) {
  const [openId, setOpenId] = useState<string | null>(PAYMENT_METHODS[0]?.id ?? null);
  const chosen = PAYMENT_METHODS.find((m) => m.id === openId);

  return (
    <div className="space-y-4">
      {/* ── choose how to pay ── */}
      <section aria-labelledby="pay-how">
        <h2 id="pay-how" className="mb-3 font-display text-lg font-bold">
          How would you like to pay?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="pay-how">
          {PAYMENT_METHODS.map((m) => {
            const active = openId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setOpenId(m.id)}
                role="radio"
                aria-checked={active}
                aria-controls={`pay-panel-${m.id}`}
                className={`clay-sm flex items-center gap-3 p-4 text-left transition ${
                  active ? "!border-sage-700 !bg-sage-100 shadow-[0_0_0_2px_var(--color-sage-500)]" : "clay-hover"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                    active ? "border-sage-800 bg-sage-600 text-cream-50" : "border-taupe-300"
                  }`}
                >
                  {active && <IconCheck className="h-3.5 w-3.5" />}
                </span>
                <span>
                  <span className="block font-display text-[1.05rem] font-bold">{m.name}</span>
                  <span className="font-sans text-[0.82rem] text-ink-600">{m.tagline}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── the selected method, as a little order slip ── */}
      {chosen && (
        <section
          id={`pay-panel-${chosen.id}`}
          className="stitch animate-fade-up bg-paper p-5"
          aria-label={`${chosen.name} payment details`}
        >
          <p className="eyebrow mb-3">Pay with {chosen.name}</p>

          <dl className="space-y-3">
            <div className="clay-sm flex flex-wrap items-center justify-between gap-3 bg-cream-50 p-4">
              <div className="min-w-0">
                <dt className="font-sans text-[0.8rem] font-bold text-ink-600">{chosen.numberLabel}</dt>
                <dd className="select-all break-all font-display text-[1.6rem] font-bold leading-tight text-ink-900 sm:text-[1.8rem]">
                  {chosen.number}
                </dd>
              </div>
              <CopyButton value={chosen.number} label={chosen.numberLabel} />
            </div>

            <div className="clay-sm flex flex-wrap items-center justify-between gap-3 bg-cream-50 p-4">
              <div className="min-w-0">
                <dt className="font-sans text-[0.8rem] font-bold text-ink-600">Exact amount to send</dt>
                <dd className="select-all font-display text-[1.6rem] font-bold leading-tight text-ink-900 sm:text-[1.8rem]">
                  {formatMoney(total)}
                </dd>
              </div>
              <CopyButton value={plainAmount(total)} label="order total" />
            </div>
          </dl>

          <ol className="mt-4 grid gap-2 font-sans text-[0.95rem] leading-relaxed text-ink-600">
            {chosen.steps.map((step, i) => (
              <li key={step} className="flex gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blush-200 font-display text-[0.72rem] font-bold text-rose-700"
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── send the proof ── */}
      <section className="clay p-5" aria-labelledby="pay-proof">
        <h2 id="pay-proof" className="font-display text-lg font-bold">
          Paid already?
        </h2>
        <p className="mt-1 font-sans text-[0.95rem] leading-relaxed text-ink-600">
          Send us your payment screenshot on Instagram so we can verify your order.
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-[1.3fr_1fr]">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-lg w-full"
          >
            Send payment proof on Instagram
          </a>
          <CopyButton
            variant="blush"
            className="!min-h-[54px] w-full !text-[1rem]"
            label="order details message"
            value={messageTemplate(orderNumber, customerName, total, chosen?.name ?? "GCash / MariBank")}
          />
        </div>
        <p className="mt-2.5 font-sans text-[0.82rem] leading-snug text-ink-600">
          “Copy” puts a short message on your clipboard. Paste it into the chat with{" "}
          <span className="font-bold">@{INSTAGRAM_HANDLE}</span> and attach your screenshot.
        </p>
      </section>

      {/* ── what happens next ── */}
      <section className="stitch bg-blush-100/50 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="taupe">Awaiting payment</Badge>
          <span className="font-sans text-[0.86rem] font-bold text-ink-800">
            A placed order is not a confirmed order yet.
          </span>
        </div>
        <ul className="mt-3 grid gap-1.5 font-sans text-[0.92rem] leading-relaxed text-ink-600">
          <li>
            Please send your payment screenshot after transferring. Your order will be confirmed
            once we&apos;ve verified your payment.
          </li>
          <li>
            Please include your order number{" "}
            <span className="font-bold text-ink-800">#{orderNumber}</span> when messaging us so we
            can find your order quickly.
          </li>
        </ul>
        <p className="mt-3 border-t border-brown-500/15 pt-3 font-sans text-[0.82rem] leading-snug text-ink-600">
          We will never ask for your OTP, PIN, or banking password. We only ever ask for a
          screenshot of your completed transfer.
        </p>
      </section>
    </div>
  );
}
