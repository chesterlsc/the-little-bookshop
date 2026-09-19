"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { colorHex, getProduct, shelfShot, type Product } from "@/lib/catalog";
import { seedBuilderShelf } from "@/lib/builder-handoff";
import { formatMoney } from "@/lib/money";
import { IconArrowRight, IconCheck } from "./icons";
import { ShelfRuleDivider } from "./illustrations";

/**
 * The first fold: the shelf itself, full width, with the words laid over it.
 *
 * The photograph is the page. The step, the heading and the line under it sit
 * on the picture behind two soft scrims — one from the top for the step, one
 * from the bottom for the words — so the shelf keeps the whole middle to
 * itself. Below it, the one question (which shape) and the one way on.
 *
 * All three hero shots are 3:4 and so is the frame, so the photograph is never
 * cropped. The frame is as wide as the column allows until the viewport runs
 * short, then narrows instead, so the choices and the button always land above
 * the floating nav. Changing shape dissolves between the three photographs,
 * which stay mounted so nothing loads at the moment of the tap.
 *
 * A desktop has the width to show all three at once, so there the fold is the
 * three photographs side by side under the question, the picked one lifted.
 */

const SHAPES = [
  { slug: "mini-classic-bookshelf", label: "Classic", blurb: "columns and a cornice" },
  { slug: "mini-scalloped-bookshelf", label: "Scalloped", blurb: "a scallop on every shelf" },
  { slug: "mini-arched-bookshelf", label: "Arched", blurb: "one soft arch on top" },
];

/**
 * One `sizes` for both layouts, so a phone and a desktop ask for the same files.
 * On a desktop the photograph is never wider than a third of the column, 316px.
 */
const SIZES = "(min-width:1024px) 320px, 94vw";

const money = (cents: number) => formatMoney(cents).replace(/\.00$/, "");

function priceLine(product: Product): string {
  const price = (size: string) =>
    money(product.variants.find((v) => v.options.Size === size)?.price ?? product.minPrice);
  return `Mini ${price("Mini")} · Regular ${price("Regular")}`;
}

export function ShelfPicker() {
  const router = useRouter();
  const [slug, setSlug] = useState(SHAPES[0].slug);

  const product = getProduct(slug)!;
  const shot = shelfShot(slug)!;

  const start = () => {
    seedBuilderShelf(slug);
    router.push("/build");
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 sm:gap-4 lg:hidden">
        {/* ── the photograph, and the words on it ── */}
        <figure className="hero-photo pop-card relative m-0 shrink-0 overflow-hidden rounded-[1.4rem] bg-cream-200 shadow-[0_24px_40px_-22px_rgba(67,54,42,0.7),0_0_0_1px_rgba(67,54,42,0.08)]">
          {SHAPES.map((s) => {
            const photo = shelfShot(s.slug)!;
            const active = s.slug === slug;
            return (
              <Image
                key={s.slug}
                src={photo.src}
                alt={active ? photo.alt : ""}
                aria-hidden={!active}
                fill
                preload={s.slug === SHAPES[0].slug}
                sizes={SIZES}
                className={`object-cover object-center transition-opacity duration-[450ms] ease-out motion-reduce:transition-none ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              />
            );
          })}

          {/* two scrims, so cream type reads on a pale wall and a dark table alike */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink-900/55 via-ink-900/18 to-transparent" />
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-ink-900/85 via-ink-900/45 to-transparent" />

          {/* where you are */}
          <div className="absolute inset-x-4 top-4 flex items-center gap-3 sm:inset-x-5 sm:top-5">
            <span className="shrink-0 font-sans text-[0.7rem] font-black tracking-[0.2em] text-cream-50 sm:text-[0.76rem]">
              STEP 1 OF 3
            </span>
            <span aria-hidden className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-cream-50/30">
              <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-cream-50" />
            </span>
          </div>

          {/* which colour this photograph is */}
          <figcaption className="absolute right-3 top-11 max-w-[70%] sm:right-4 sm:top-12">
            <span
              key={shot.shownIn}
              className="fade-swap story-line inline-flex items-center gap-1.5 rounded-full bg-ink-900/62 px-3 py-1 text-[0.72rem] leading-tight text-cream-50 backdrop-blur-[2px]"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-cream-50/70"
                style={{ background: colorHex(shot.shownIn) }}
              />
              shown in {shot.shownIn}
            </span>
          </figcaption>

          {/* the words, on the picture */}
          <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
            <h1 className="text-balance font-display text-[clamp(1.75rem,1.1rem+3.6vw,3rem)] font-bold leading-[1.02] text-cream-50 [text-shadow:0_2px_14px_rgba(35,25,15,0.35)]">
              Start with a{" "}
              <span className="relative inline-block whitespace-nowrap">
                shelf.
                <svg viewBox="0 0 200 16" preserveAspectRatio="none" className="hero-accent-line" aria-hidden role="presentation">
                  <path
                    d="M4 8.5 C 34 3.5 66 12.5 100 7.5 S 168 3.5 196 9"
                    pathLength={300}
                    className="sketch-once"
                    style={{ animationDelay: "520ms" }}
                    fill="none"
                    stroke="var(--color-sun-200)"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 12.8 C 42 8.2 72 16.4 108 11.4 S 170 8.6 192 13.2"
                    pathLength={300}
                    className="sketch-once"
                    style={{ animationDelay: "740ms" }}
                    fill="none"
                    stroke="var(--color-blush-200)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="story-line mt-2.5 max-w-[34ch] text-pretty text-[0.95rem] leading-snug text-cream-50/92 sm:text-[1.05rem] [@media(max-height:700px)]:hidden">
              Three silhouettes, nine colours — then you name the books.
            </p>
          </div>
        </figure>

        {/* ── the one question, and the way on ── */}
        <div className="flex w-full flex-col gap-2.5 sm:gap-3">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Shelf shape">
            {SHAPES.map((s) => {
              const active = s.slug === slug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSlug(s.slug)}
                  className={`min-h-[44px] rounded-[1.1rem] px-3 py-2 font-display text-[0.98rem] font-semibold transition ${
                    active
                      ? "border-2 border-sage-800 bg-cream-50 text-ink-900 shadow-[0_0_0_3px_var(--color-cream-50),0_0_0_4.5px_var(--color-sage-700)]"
                      : "border-[1.5px] border-taupe-300 bg-cream-50 text-ink-600 hover:border-brown-500 hover:text-ink-800"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <p
            key={slug}
            className="fade-swap flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
          >
            <span className="font-display text-[1.06rem] font-bold text-ink-900">{product.name}</span>
            <span className="font-sans text-[0.86rem] font-bold text-sage-700">{priceLine(product)}</span>
          </p>

          <div className="relative">
            {/* the rings live outside the button so they can grow past its edge */}
            <span aria-hidden className="cta-halo" />
            <span aria-hidden className="cta-halo cta-halo-2" />
            <button
              type="button"
              onClick={start}
              className="cta-beacon group relative flex w-full items-center justify-center gap-3 py-3"
            >
              <span className="flex flex-col items-center leading-none">
                <span className="font-display text-[1.24rem] font-bold text-ink-900">Build my shelf</span>
                <span className="mt-1 font-sans text-[0.71rem] font-bold uppercase tracking-[0.12em] text-brown-600">
                  pick your colour next
                </span>
              </span>
              <IconArrowRight className="cta-nudge h-6 w-6 text-ink-900" />
            </button>
          </div>
        </div>
      </div>

      {/* ── desktop: the question, all three shelves, the way on ── */}
      <div className="hidden min-h-0 flex-1 flex-col items-center justify-center pb-[clamp(1rem,3svh,2rem)] text-center lg:flex">
        <p className="flex items-center gap-3">
          <span className="font-sans text-[0.8rem] font-black tracking-[0.24em] text-ink-800">STEP 1 OF 3</span>
          <span aria-hidden className="flex gap-1.5">
            <span className="h-[3px] w-6 rounded-full bg-sage-800" />
            <span className="h-[3px] w-6 rounded-full bg-taupe-300" />
            <span className="h-[3px] w-6 rounded-full bg-taupe-300" />
          </span>
        </p>
        <h1 className="mt-[clamp(0.5rem,1.2svh,0.9rem)] font-display text-[clamp(2.5rem,6.2svh,4.1rem)] font-bold leading-[1.02] text-ink-900">
          Pick your{" "}
          <span className="relative inline-block whitespace-nowrap">
            silhouette.
            <svg viewBox="0 0 200 16" preserveAspectRatio="none" className="hero-accent-line" aria-hidden role="presentation">
              <path
                d="M4 8.5 C 34 3.5 66 12.5 100 7.5 S 168 3.5 196 9"
                pathLength={300}
                className="sketch-once"
                style={{ animationDelay: "520ms" }}
                fill="none"
                stroke="var(--color-gold-400)"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                d="M9 12.8 C 42 8.2 72 16.4 108 11.4 S 170 8.6 192 13.2"
                pathLength={300}
                className="sketch-once"
                style={{ animationDelay: "740ms" }}
                fill="none"
                stroke="var(--color-blush-400)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>
        <p className="pick-lede story-line mt-[clamp(0.9rem,2svh,1.4rem)] text-[clamp(1.02rem,2.1svh,1.3rem)] leading-[1.45] text-ink-600">
          Three shapes, nine colours — then you name the books.
          <br />
          Colour comes next, so choose the shape you keep looking at.
        </p>

        <div className="pick-row mt-[clamp(2rem,4svh,2.75rem)]" role="radiogroup" aria-label="Shelf shape">
          {SHAPES.map((s) => {
            const photo = shelfShot(s.slug)!;
            const active = s.slug === slug;
            return (
              <button
                key={s.slug}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSlug(s.slug)}
                className="pick-card"
              >
                <span className="pick-mat">
                  {active && (
                    <span className="pick-badge" aria-hidden>
                      <IconCheck className="h-3.5 w-3.5" /> Picked
                    </span>
                  )}
                  <span className="pick-photo">
                    <Image src={photo.src} alt="" fill loading="eager" sizes={SIZES} className="object-cover" />
                  </span>
                </span>
                <span className="mt-3.5 flex items-baseline justify-between gap-3">
                  <span className="font-display text-[1.3rem] font-bold leading-none text-ink-900">{s.label}</span>
                  <span className="font-sans text-[0.92rem] font-bold text-sage-700">
                    from {money(getProduct(s.slug)!.minPrice)}
                  </span>
                </span>
                <span className="story-line mt-1.5 block text-[0.93rem] leading-snug text-ink-600">
                  {s.blurb} · <span className="whitespace-nowrap">shown in {photo.shownIn}</span>
                </span>
              </button>
            );
          })}
        </div>

        <ShelfRuleDivider className="hero-rule mt-[clamp(0.5rem,1.6svh,1.1rem)] aspect-[320/48] h-[clamp(2.25rem,calc(8svh-1.6rem),3.75rem)] w-auto" />

        <div className="mt-[clamp(0.75rem,2svh,1.4rem)] flex items-center gap-8">
          <div className="relative">
            <span aria-hidden className="cta-halo" />
            <span aria-hidden className="cta-halo cta-halo-2" />
            <button
              type="button"
              onClick={start}
              className="cta-beacon group relative flex items-center justify-center gap-4 px-8 py-3.5"
            >
              <span className="flex flex-col items-center leading-none">
                {/* all three labels share one cell, so the button is always as
                    wide as the longest and never shifts when the pick changes */}
                <span className="grid">
                  {SHAPES.map((s) => (
                    <span
                      key={s.slug}
                      aria-hidden={s.slug !== slug}
                      className={`[grid-area:1/1] font-display text-[1.5rem] font-bold text-ink-900 ${
                        s.slug === slug ? "fade-swap" : "invisible"
                      }`}
                    >
                      Build my {s.label} shelf
                    </span>
                  ))}
                </span>
                <span className="mt-1.5 font-sans text-[0.8rem] font-bold uppercase tracking-[0.14em] text-brown-600">
                  pick your colour next
                </span>
              </span>
              <IconArrowRight className="cta-nudge h-6 w-6 text-ink-900" />
            </button>
          </div>
          <p className="story-line max-w-[14rem] text-pretty text-left text-[1.02rem] leading-snug text-ink-600">
            Nothing is fixed — you can swap shape or size at any step.
          </p>
        </div>
      </div>
    </>
  );
}
