"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { colorHex, getProduct, shelfShot, type Product } from "@/lib/catalog";
import { seedBuilderShelf } from "@/lib/builder-handoff";
import { formatMoney } from "@/lib/money";
import { IconArrowRight } from "./icons";
import { FolkFlower, Leaf, Sparkle } from "./illustrations";

/**
 * The first fold: choose a shape, see that shelf, carry it into the builder.
 *
 * One question only. The shop photographed each shape in one colour, so a
 * colour picker here could only ever show the same three pictures back — the
 * swatches live in the builder, where they are drawn rather than photographed
 * and can be honest about all nine. The caption names the colour on show.
 *
 * The picture is never cropped on a phone: it sits whole inside a portrait
 * card, which is why the card is sized from the viewport height rather than
 * the width.
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
    <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-4 lg:flex-row lg:items-center lg:gap-14">
      {/* ── the picture ── the whole point of the fold, so it gets the room.
           All three shots are 3:4, so a 3:4 card shows the photograph entire
           with nothing cropped and no empty matte: the frame is the picture's
           own shape. ── */}
      <figure className="picker-photo order-2 relative m-0 flex w-full items-center justify-center lg:order-1 lg:w-1/2">
        <div key={slug} className="pop-card relative aspect-[3/4] h-full max-w-full lg:h-auto lg:w-full">
          {/* the light it sits in */}
          <span
            aria-hidden
            className="absolute -inset-5 -z-10 rounded-[46%] bg-[radial-gradient(60%_55%_at_50%_45%,var(--color-sun-200)_0%,color-mix(in_srgb,var(--color-blush-200)_70%,transparent)_45%,transparent_72%)] opacity-70 blur-xl"
          />
          {/* the pencil under-drawing, still showing under the finished thing */}
          <span
            aria-hidden
            className="clay-sm absolute inset-0 rotate-[-2.2deg] border-[1.5px] border-dashed border-taupe-300 bg-transparent"
          />
          <div className="clay-sm absolute inset-0 rotate-[0.7deg] overflow-hidden bg-cream-50 p-1.5 shadow-[0_26px_40px_-20px_rgba(94,73,52,0.55)]">
            <div className="relative h-full w-full overflow-hidden rounded-[0.9rem] bg-cream-200">
              <Image
                key={shot.src}
                src={shot.src}
                alt={shot.alt}
                fill
                priority
                sizes="(min-width:1024px) 44vw, 86vw"
                className="fade-swap object-cover object-center"
              />
            </div>
            <figcaption className="absolute bottom-3 left-3 right-3">
              <span className="story-line inline-flex max-w-full items-center gap-1.5 rounded-full bg-ink-900/62 px-3 py-1 text-[0.72rem] leading-tight text-cream-50 backdrop-blur-[2px]">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full border border-cream-50/70"
                  style={{ background: colorHex(shot.shownIn) }}
                />
                shown in {shot.shownIn}
              </span>
            </figcaption>
          </div>
          {/* a strip of tape and a sprig, the way the rest of the shop is dressed */}
          <span
            aria-hidden
            className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-[5deg] rounded-[2px] bg-blush-200/85 shadow-[inset_0_0_0_1px_rgba(214,138,120,0.35)]"
          />
          <svg
            viewBox="0 0 34 26"
            className="soft-in absolute -right-3 -top-5 w-9 sm:w-11"
            style={{ animationDelay: "700ms" }}
            aria-hidden
            role="presentation"
          >
            <Leaf x={2} y={16} s={6} angle={-28} />
            <FolkFlower x={24} y={9} r={5} />
            <Sparkle x={31} y={22} s={3} />
          </svg>
        </div>
      </figure>

      {/* ── the words and the one question ── */}
      <div className="contents lg:order-2 lg:flex lg:w-1/2 lg:max-w-[32rem] lg:flex-col lg:gap-5">
        <header className="order-1 text-center lg:text-left">
          <p className="eyebrow inline-flex items-center gap-2">
            Step 1 of 3
            <span aria-hidden className="flex items-center gap-1">
              <span className="h-[3px] w-6 rounded-full bg-sage-600" />
              <span className="h-[3px] w-3 rounded-full bg-taupe-300" />
              <span className="h-[3px] w-3 rounded-full bg-taupe-300" />
            </span>
          </p>
          <h1 className="hero-h1 mt-1 text-balance font-display font-bold text-ink-900">
            Start with a shelf.
          </h1>
          <p className="story-line mx-auto mt-1 max-w-[32ch] text-pretty text-[0.93rem] leading-snug text-ink-600 [@media(max-height:700px)]:hidden sm:text-[1.08rem] lg:mx-0 lg:!block">
            Three silhouettes, nine colours — then you name the books.
          </p>
        </header>

        <div className="order-3 space-y-1.5 sm:space-y-2">
          <div className="flex flex-wrap justify-center gap-2 lg:justify-start" role="radiogroup" aria-label="Shelf shape">
            {SHAPES.map((s) => {
              const active = s.slug === slug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSlug(s.slug)}
                  className={`min-h-[42px] flex-1 rounded-full border-[1.5px] px-4 py-1.5 font-display text-[0.96rem] font-semibold transition sm:flex-none sm:px-6 ${
                    active
                      ? "border-sage-800 bg-sage-600 text-cream-50 shadow-[0_2px_0_var(--color-sage-800)]"
                      : "border-taupe-300 bg-cream-50 text-ink-600 hover:border-brown-500 hover:text-ink-800"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center lg:justify-start lg:text-left">
            <span className="font-display text-[1.05rem] font-bold text-ink-900">{product.name}</span>
            <span className="font-sans text-[0.85rem] font-bold text-sage-700">{priceLine(product)}</span>
          </p>
        </div>

        <div className="order-4">
          <button
            type="button"
            onClick={start}
            className="btn btn-primary group w-full justify-center !py-3 text-[1.02rem]"
          >
            Next — pick your colour
            <IconArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
