"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { isValidCode, normalizeCode } from "@/lib/discount";
import { formatMoney } from "@/lib/money";
import { PROMO, promoDaysLeft, promoLive } from "@/lib/promo";
import { CopyButton } from "./copy-button";
import { Sparkle } from "./illustrations";
import { ButtonLink } from "./ui";

/**
 * Everything the shop says about the running promo, switched by the clock.
 *
 * Most pages are built ahead of time, so the server's answer is only where a
 * page starts: each piece checks the real time once it is in the browser, and
 * the promo appears and disappears at midnight in Manila with no deploy.
 */

const peso = (cents: number) => formatMoney(cents).replace(/\.00$/, "");
const SHOP_LINK = `/shop?code=${PROMO.code}`;
const CODE_KEY = "tlb-code";

/** Live now, by this browser's clock. `initial` is what the page was built with. */
export function usePromoLive(initial = false): boolean {
  const [live, setLive] = useState(initial);
  useEffect(() => setLive(promoLive()), []);
  return live;
}

/**
 * A link like /shop?code=BOOKISH10 (the email's button, the ribbon) keeps the
 * code, so the checkout can have it waiting. Mounted once, in the layout.
 */
export function CodeFromLink() {
  useEffect(() => {
    const code = normalizeCode(new URLSearchParams(window.location.search).get("code"));
    if (!code || !isValidCode(code)) return;
    try {
      localStorage.setItem(CODE_KEY, code);
    } catch {
      /* storage unavailable: they can still type it */
    }
  }, []);
  return null;
}

/** The code a link left for the checkout, if it is still one the shop runs. */
export function rememberedCode(): string {
  try {
    const code = localStorage.getItem(CODE_KEY) ?? "";
    return isValidCode(code) ? code : "";
  } catch {
    return "";
  }
}

/**
 * The home page's 10.10 ticket: the offer, the code to copy, the days left, and
 * the shop's own poster beside it on a wide screen.
 */
export function PromoBand({ initialLive }: { initialLive: boolean }) {
  const live = usePromoLive(initialLive);
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => setDays(promoDaysLeft()), []);
  if (!live) return null;
  return (
    <section aria-labelledby="promo-title" className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
      <div className="enter grid items-center gap-6 lg:grid-cols-[1fr_auto] lg:gap-10">
        <div className="promo-ticket relative mx-auto w-full max-w-xl text-center">
          <span aria-hidden className="promo-sticker">
            <span>Free</span>
            <span className="text-[0.62em]">shipping</span>
          </span>
          <svg viewBox="0 0 40 40" aria-hidden className="promo-twinkle absolute left-5 top-6 h-5 w-5">
            <Sparkle x={20} y={20} s={9} />
          </svg>
          <svg viewBox="0 0 40 40" aria-hidden className="promo-twinkle promo-twinkle-2 absolute bottom-8 right-7 h-4 w-4">
            <Sparkle x={20} y={20} s={9} />
          </svg>

          <p className="font-sans text-[0.78rem] font-black uppercase tracking-[0.22em] text-rose-600">
            {PROMO.name} <span aria-hidden>♥</span>
          </p>
          <h2 id="promo-title" className="mt-2 font-display text-[clamp(2.9rem,9vw,4.6rem)] font-bold leading-none text-ink-900">
            {peso(PROMO.amountOff)} off
          </h2>
          <p className="mt-2 font-sans text-[0.95rem] font-bold uppercase tracking-[0.16em] text-ink-800">
            on orders {peso(PROMO.minimum)}+
          </p>
          <p className="story-line mt-1 text-[1.02rem] text-ink-600">and the shipping is on us.</p>

          <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2">
            <span className="promo-code-box">{PROMO.code}</span>
            <CopyButton value={PROMO.code} label="the code" />
          </div>
          <p className="mt-3 font-sans text-sm font-bold tracking-[0.12em] text-ink-600">
            {PROMO.dates.toUpperCase()}
            {days !== null && days > 0 && (
              <span className="ml-2 rounded-full bg-blush-200 px-2 py-0.5 text-[0.72rem] tracking-[0.06em] text-rose-700">
                {days === 1 ? "last day!" : `${days} days left`}
              </span>
            )}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <ButtonLink href={SHOP_LINK} className="btn-lg">
              Shop the treat
            </ButtonLink>
            <ButtonLink href="/build" variant="quiet" className="btn-lg">
              Build a shelf
            </ButtonLink>
          </div>
          <p className="mt-3 font-sans text-xs text-ink-400">
            Gift cards don&apos;t count towards {peso(PROMO.minimum)}. One code per order.
          </p>
        </div>

        <Image
          src={PROMO.image.src}
          alt={PROMO.image.alt}
          width={PROMO.image.width}
          height={PROMO.image.height}
          sizes="320px"
          className="hidden w-[18.5rem] rotate-2 rounded-[1.3rem] shadow-[0_22px_34px_-18px_rgba(67,54,42,0.55)] lg:block"
        />
      </div>
    </section>
  );
}

/**
 * The line under a basket's total: how far it is to free shipping, and while
 * the promo runs, to the code too, with a bar that fills as things are added.
 * `shippable` is what the products come to; gift cards never count.
 */
export function ShippingNudge({
  shippable,
  minimum,
  className = "",
}: {
  shippable: number;
  /** the free-shipping line */
  minimum: number;
  className?: string;
}) {
  const live = usePromoLive();
  if (shippable === 0) {
    return <p className={`text-xs text-ink-600 ${className}`}>A gift card is digital, so there&apos;s no shipping fee.</p>;
  }
  if (!live) {
    return (
      <p className={`text-xs text-ink-600 ${className}`}>
        {shippable >= minimum ? "Shipping is free on this order." : `Add ${peso(minimum - shippable)} more for free shipping.`}
      </p>
    );
  }
  const unlocked = shippable >= PROMO.minimum;
  return (
    <div className={className} role="status">
      <p className={`text-xs font-bold ${unlocked ? "text-sage-800" : "text-ink-800"}`}>
        {unlocked
          ? `Unlocked: ${peso(PROMO.amountOff)} off with ${PROMO.code}, and free shipping ✓`
          : `Add ${peso(PROMO.minimum - shippable)} more for ${peso(PROMO.amountOff)} off and free shipping`}
      </p>
      <span aria-hidden className="promo-meter mt-1.5">
        <span
          className={unlocked ? "is-full" : ""}
          style={{ width: `${Math.min(100, (shippable / PROMO.minimum) * 100)}%` }}
        />
      </span>
    </div>
  );
}

/** At checkout, once the basket qualifies: the code, one tap away. */
export function PromoApply({ applied, onApply, qualifies }: { applied: string; onApply: (code: string) => void; qualifies: boolean }) {
  const live = usePromoLive();
  if (!live || !qualifies || applied === PROMO.code) return null;
  return (
    <button type="button" onClick={() => onApply(PROMO.code)} className="promo-apply mt-2 w-full">
      <span className="promo-pill !text-[0.8rem]">{PROMO.code}</span>
      <span className="whitespace-nowrap">
        Tap to take off <strong>{peso(PROMO.amountOff)}</strong>
      </span>
    </button>
  );
}
