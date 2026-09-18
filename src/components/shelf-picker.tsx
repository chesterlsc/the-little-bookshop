"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { colorHex, getProduct, shelfShot, type Product } from "@/lib/catalog";
import { seedBuilderShelf } from "@/lib/builder-handoff";
import { formatMoney } from "@/lib/money";
import { IconArrowRight } from "./icons";

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
 */

const SHAPES = [
  { slug: "mini-classic-bookshelf", label: "Classic" },
  { slug: "mini-scalloped-bookshelf", label: "Scalloped" },
  { slug: "mini-arched-bookshelf", label: "Arched" },
];

function priceLine(product: Product): string {
  const price = (size: string) =>
    formatMoney(product.variants.find((v) => v.options.Size === size)?.price ?? product.minPrice)
      .replace(/\.00$/, "");
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
    <div className="flex min-h-0 flex-1 flex-col items-center gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
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
              priority={s.slug === SHAPES[0].slug}
              sizes="(min-width:1024px) 46vw, 94vw"
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
          <p className="story-line mt-2.5 max-w-[34ch] text-pretty text-[0.95rem] leading-snug text-cream-50/92 sm:text-[1.05rem] [@media(max-height:700px)]:hidden lg:!block">
            Three silhouettes, nine colours — then you name the books.
          </p>
        </div>
      </figure>

      {/* ── the one question, and the way on ── */}
      <div className="flex w-full flex-col gap-2.5 sm:gap-3 lg:w-[40%] lg:max-w-[30rem] lg:gap-5">
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
  );
}
