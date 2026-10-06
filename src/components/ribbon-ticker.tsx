"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { FREE_SHIPPING_MINIMUM } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { PROMO, promoDaysLeft } from "@/lib/promo";
import { IconArrowRight } from "./icons";
import { usePromoLive } from "./promo";

/**
 * The ribbon's messages, taking turns: each rises in from below with its own
 * little badge, holds while a hairline fills along the bottom, and rises away,
 * and the ribbon's colour follows it: rose for a deal, sage for shipping, cocoa
 * for the clock. Free shipping is always one of them; while a promo runs it
 * leads, and the last turn counts the days.
 *
 * Every message is one line and they share one grid cell, so the ribbon never
 * changes size; with very large text the words give way (an ellipsis), never
 * the code. It holds still while a pointer is over it or a keyboard is in it,
 * so nobody chases a moving link, and the button at its end stops it for good
 * (WCAG 2.2.2). On a wide screen the dots jump straight to any message. A
 * phone gets shorter words than a desktop.
 */

const peso = (cents: number) => formatMoney(cents).replace(/\.00$/, "");
const SLIDE_MS = 4400;

type Tone = "rose" | "sage" | "cocoa";

/* the badges: one drawn mark per message, in the message's own colour */
const ICON = "h-[1.05em] w-[1.05em]";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Tag() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} {...stroke}>
      <path d="M3.5 12.2V4.6c0-.6.5-1.1 1.1-1.1h7.6l8.3 8.3-8.7 8.7z" />
      <circle cx="8.3" cy="8.3" r="1.5" />
    </svg>
  );
}

/** A delivery van. It drives in with its message, wheels bumping, speed lines trailing. */
function Van() {
  return (
    <svg viewBox="0 0 30 18" className="ribbon-van h-[1em] w-[1.6em]" {...stroke}>
      <path className="ribbon-speed" d="M1 7h4M0.5 10.5h3" />
      <path d="M7 4h11v9H7z" />
      <path d="M18 7h4.6l3.4 3.4V13h-8" />
      <circle className="ribbon-wheel" cx="10.5" cy="13.8" r="2" fill="var(--color-cream-50)" />
      <circle className="ribbon-wheel" cx="22.3" cy="13.8" r="2" fill="var(--color-cream-50)" />
    </svg>
  );
}

function Hourglass() {
  return (
    <svg viewBox="0 0 24 24" className={`ribbon-hourglass ${ICON}`} {...stroke}>
      <path d="M6.5 3.5h11M6.5 20.5h11M7.5 3.5c0 4.5 4.5 5.5 4.5 8.5s-4.5 4-4.5 8.5M16.5 3.5c0 4.5-4.5 5.5-4.5 8.5s4.5 4 4.5 8.5" />
      <path d="M10 18.2h4" />
    </svg>
  );
}

function Gift() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} {...stroke}>
      <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" />
      <path d="M12 7c-1.5-3.5-5.5-3.2-5 0M12 7c1.5-3.5 5.5-3.2 5 0" />
    </svg>
  );
}

interface Slide {
  key: string;
  href: string;
  tone: Tone;
  label: string;
  icon: ReactNode;
  /** the words: these shorten with an ellipsis if the room runs out */
  words: ReactNode;
  /** what must always show whole, after the words */
  extra?: ReactNode;
}

export function RibbonTicker({ initialLive }: { initialLive: boolean }) {
  const live = usePromoLive(initialLive);
  const [days, setDays] = useState<number | null>(null);
  const [turn, setTurn] = useState<{ current: number; previous: number | null }>({ current: 0, previous: null });
  // three reasons to hold still: a pointer on it, a keyboard in it, or the stop button
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [stopped, setStopped] = useState(false);
  const paused = hover || focus || stopped;
  useEffect(() => setDays(promoDaysLeft()), []);

  const shipping: Slide = {
    key: "shipping",
    href: "/shop",
    tone: "sage",
    label: "Free shipping",
    icon: <Van />,
    words: (
      <>
        Free shipping on <span className="hidden sm:inline">every order of </span>
        <span className="ribbon-figure">{peso(FREE_SHIPPING_MINIMUM)}</span>
        <span className="hidden sm:inline"> or more</span>
        <span className="sm:hidden">+</span>
      </>
    ),
  };
  const slides: Slide[] = live
    ? [
        {
          key: "promo",
          href: `/shop?code=${PROMO.code}`,
          tone: "rose",
          label: "The 10.10 treat",
          icon: <Tag />,
          words: (
            <>
              <span className="hidden sm:inline">{PROMO.name} · </span>
              {peso(PROMO.amountOff)} off {peso(PROMO.minimum)}+<span className="hidden sm:inline"> with</span>
            </>
          ),
          extra: <span className="ribbon-stub">{PROMO.code}</span>,
        },
        shipping,
        {
          key: "days",
          href: `/shop?code=${PROMO.code}`,
          tone: "cocoa",
          label: "Days left",
          icon: <Hourglass />,
          words: (
            <>
              {days === 1 ? (
                "Last day of the 10.10 treat!"
              ) : days === null ? (
                `The 10.10 treat ends ${PROMO.lastDay}`
              ) : (
                <>
                  <span className="sm:hidden">10.10 treat: {days} days left</span>
                  <span className="hidden sm:inline">
                    Only {days} days left of the 10.10 treat · ends {PROMO.lastDay}
                  </span>
                </>
              )}
            </>
          ),
        },
      ]
    : [
        shipping,
        {
          key: "gifts",
          href: "/products/gift-card",
          tone: "rose",
          label: "Gift cards",
          icon: <Gift />,
          words: (
            <>
              New: gift cards from ₱500<span className="hidden sm:inline"> · digital, so no shipping fee</span>
            </>
          ),
        },
      ];
  // Every message twice over: the one that just left is then never the next to
  // come in (it would drop from above), whether the turn is the clock's or a dot's.
  const turns = slides.length < 4 ? [...slides, ...slides.map((s) => ({ ...s, key: `${s.key}-again` }))] : slides;
  const n = turns.length;
  const shown = turn.current % n;
  const tone = turns[shown].tone;

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => {
      setTurn((s) => ({ previous: s.current % n, current: (s.current + 1) % n }));
    }, SLIDE_MS);
    return () => window.clearInterval(t);
  }, [paused, n]);

  /** A dot asks for a message: go forward to its next turn, so it still rises in from below. */
  const jumpTo = (slide: number) => {
    if (shown % slides.length === slide) return; // already showing
    for (let k = 1; k <= n; k++) {
      const i = (shown + k) % n;
      if (i % slides.length === slide) {
        if (i !== shown) setTurn({ previous: shown, current: i });
        return;
      }
    }
  };

  return (
    <div
      className="ribbon-ticker"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      // only a keyboard's focus holds it: a tapped link keeps focus after the
      // page changes, and that must not freeze the ribbon for the whole visit
      onFocus={(e) => setFocus(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
      }}
    >
      {/* the colour of the message showing, washing in under everything */}
      <span aria-hidden className={`ribbon-tone ribbon-tone-rose ${tone === "rose" ? "is-on" : ""}`} />
      <span aria-hidden className={`ribbon-tone ribbon-tone-cocoa ${tone === "cocoa" ? "is-on" : ""}`} />

      {turns.map((s, i) => (
        <Link
          key={s.key}
          href={s.href}
          aria-hidden={i !== shown}
          tabIndex={i === shown ? undefined : -1}
          data-tone={s.tone}
          className={`ribbon-msg ${i === shown ? "is-in" : i === turn.previous ? "is-out" : "is-wait"}`}
        >
          <span aria-hidden className="ribbon-badge">
            {s.icon}
          </span>
          <span className="ribbon-words">{s.words}</span>
          {s.extra}
          <IconArrowRight aria-hidden className="ribbon-arrow h-[0.95em] w-[0.95em] shrink-0" />
        </Link>
      ))}

      <span className="ribbon-dots" role="group" aria-label="Choose a message">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => jumpTo(i)}
            aria-label={`Show: ${s.label}`}
            aria-pressed={shown % slides.length === i}
            className="ribbon-dot"
          />
        ))}
      </span>

      {/* stop and start, at every width */}
      <button
        type="button"
        onClick={() => setStopped((v) => !v)}
        aria-label={stopped ? "Play the shop news" : "Pause the shop news"}
        className="ribbon-pause"
      >
        <svg viewBox="0 0 16 16" aria-hidden className="h-[0.7rem] w-[0.7rem]" fill="currentColor">
          {stopped ? <path d="M5 3.2v9.6L12.6 8z" /> : <path d="M4.2 3h2.6v10H4.2zM9.2 3h2.6v10H9.2z" />}
        </svg>
      </button>

      {/* how long this message has left: empty while held, then a fresh run in
          step with the clock, which also starts over when the hold ends */}
      <span aria-hidden key={`${shown}-${paused}`} className={`ribbon-progress ${paused ? "is-paused" : ""}`} />
      <span aria-hidden className="ribbon-sheen" />
    </div>
  );
}
