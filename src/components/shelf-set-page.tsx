"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COVER_STYLES,
  SHELF_COLORS,
  SHELF_SET,
  getProduct,
  productsInCategory,
  shelfSetWorth,
  shelfShot,
} from "@/lib/catalog";
import { validTitles, type CustomTitle } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { useCart } from "./cart-context";
import { IconCheck } from "./icons";
import { Equation } from "./shelf-set-band";
import { SixTitlesForm, emptyTitles } from "./six-titles-form";
import { Button, Field, inputClass, Section } from "./ui";

/**
 * The Little Shelf Set's own page: the four things it is made of, chosen in
 * order — the shelf, the twelve books, the plant (already in), the letter —
 * with the price fixed at ₱1,799 and what the same things cost one by one
 * beside it. On a phone the button rides in a tray above the bottom bar.
 */

const peso = (cents: number) => formatMoney(cents).replace(/\.00$/, "");
const SHELVES = productsInCategory("bookshelves");
const BOOK_SETS = productsInCategory("mini-books");
const LETTERS = getProduct(SHELF_SET.letterSlug)!;
const PLANT = getProduct(SHELF_SET.plantSlug)!;
const WORDS = LETTERS.options.find((o) => o.name === "Word")!.values;

interface SetChoice {
  slug: string;
  titles: CustomTitle[];
}

function Swatches({ value, onPick, label }: { value: string; onPick: (c: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {SHELF_COLORS.map((c) => (
        <button
          key={c.name}
          type="button"
          role="radio"
          aria-checked={value === c.name}
          aria-label={c.name}
          title={c.name}
          onClick={() => onPick(c.name)}
          className={`h-9 w-9 rounded-full border-2 transition ${
            value === c.name
              ? "scale-110 border-ink-800 shadow-[0_0_0_3px_var(--color-cream-50),0_0_0_5px_var(--color-sage-500)]"
              : "border-ink-800/25 hover:scale-105"
          }`}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

/** A numbered step, so the page reads as four short decisions. */
function Step({ n, title, note, children }: { n: number; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="kit-step">
      <h2 className="flex items-baseline gap-2.5 font-display text-[1.2rem] font-bold text-ink-900">
        <span className="kit-step-n" aria-hidden>
          {n}
        </span>
        {title}
      </h2>
      {note && <p className="mt-0.5 pl-9 font-sans text-sm text-ink-600">{note}</p>}
      <div className="mt-3 pl-0 sm:pl-9">{children}</div>
    </section>
  );
}

export function ShelfSetPage() {
  const { addLine, openDrawer } = useCart();
  const [shelf, setShelf] = useState("mini-scalloped-bookshelf");
  const [color, setColor] = useState("Blush Pink");
  const [sets, setSets] = useState<SetChoice[]>([
    { slug: "mini-jenny-han-set", titles: emptyTitles() },
    { slug: "mini-fourth-wing-set", titles: emptyTitles() },
  ]);
  const [word, setWord] = useState("TBR");
  const [letterColor, setLetterColor] = useState("Choco Brown");
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [added, setAdded] = useState(false);

  // a shelf page's "make it a set" brings its shelf along
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("shelf");
    if (wanted && SHELVES.some((s) => s.slug === wanted)) setShelf(wanted);
  }, []);

  const worth = shelfSetWorth(shelf, sets.map((s) => s.slug));
  const saving = worth - SHELF_SET.price;
  const isCustom = (slug: string) => Boolean(getProduct(slug)?.customSet);
  const titlesMissing = sets.some((s) => isCustom(s.slug) && !validTitles(s.titles));

  const pickSet = (i: number, slug: string) =>
    setSets((all) => all.map((s, j) => (j === i ? { slug, titles: s.titles } : s)));
  const setTitles = (i: number, titles: CustomTitle[]) =>
    setSets((all) => all.map((s, j) => (j === i ? { ...s, titles } : s)));

  const add = () => {
    if (titlesMissing) {
      setShowErrors(true);
      document.querySelector("[data-kit-titles]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const shelfProduct = getProduct(shelf)!;
    const shelfVariant = shelfProduct.variants.find((v) => v.options.Size === "Regular" && v.options.Color === color)!;
    const part = (s: SetChoice) => {
      const p = getProduct(s.slug)!;
      const v = p.variants.find((x) => x.options["Cover Style"] === COVER_STYLES[0]) ?? p.variants[0];
      return {
        slug: p.slug,
        variantId: v.id,
        titles: p.customSet ? s.titles.map((t) => ({ title: t.title.trim(), author: t.author.trim() })) : undefined,
      };
    };
    const letter = LETTERS.variants.find((v) => v.options.Word === word && v.options.Color === letterColor)!;
    addLine({
      type: "bundle",
      kit: SHELF_SET.slug,
      qty: 1,
      shelf: { slug: shelf, variantId: shelfVariant.id },
      set: part(sets[0]),
      extraSets: [part(sets[1])],
      accessories: [
        { slug: PLANT.slug, variantId: PLANT.variants[0].id },
        { slug: LETTERS.slug, variantId: letter.id },
      ],
      notes: notes.trim() || undefined,
    });
    setAdded(true);
    setShowErrors(false);
    window.setTimeout(() => setAdded(false), 1800);
    openDrawer();
  };

  const label = added ? "Added to your basket" : `Add the set · ${peso(SHELF_SET.price)}`;

  return (
    <div className="kit-page">
      <Section className="pt-4 lg:pt-6">
        <nav aria-label="Breadcrumb" className="mb-3 font-sans text-sm text-ink-600">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="font-bold text-ink-800">
              {SHELF_SET.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          {/* the poster: beside the choices on a desktop, after them on a phone */}
          <div className="order-last lg:order-none lg:sticky lg:top-24 lg:self-start">
            <Image
              src={SHELF_SET.poster.src}
              alt="The Little Shelf Set: a Regular shelf, two mini book sets, a miniature plant and a shelf letter, for ₱1,799"
              width={SHELF_SET.poster.width}
              height={SHELF_SET.poster.height}
              sizes="(min-width:1024px) 40vw, 92vw"
              className="mx-auto w-full max-w-md rounded-[1.4rem] shadow-[0_24px_36px_-22px_rgba(67,54,42,0.55)]"
            />
          </div>

          {/* min-w-0: the book-set row scrolls sideways, and must not widen the column doing it */}
          <div className="min-w-0">
            <p className="font-sans text-[0.78rem] font-black uppercase tracking-[0.2em] text-rose-600">New · best value</p>
            <h1 className="mt-1 font-display text-[2.1rem] font-bold leading-none text-ink-900 sm:text-[2.6rem]">
              <span className="kit-brush">{SHELF_SET.name}</span>
            </h1>
            <p className="story-line mt-2 text-[1.05rem] text-ink-600">Everything you need to build your little shelf.</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="kit-price">{peso(SHELF_SET.price)}</span>
              <span className="font-sans text-sm text-ink-600">
                <s className="text-ink-400">{peso(worth)}</s> bought one by one ·{" "}
                <strong className="text-sage-800">you save {peso(saving)}</strong>
              </span>
            </div>

            {/* what's inside, as the poster adds it up */}
            <div className="mt-5">
              <Equation />
            </div>

            <div className="mt-7 space-y-8">
              <Step n={1} title="Your shelf" note="Regular · 9 in H × 5 in W × 1.5 in D">
                <div role="radiogroup" aria-label="Shelf style" className="grid grid-cols-3 gap-2.5">
                  {SHELVES.map((p) => {
                    const shot = shelfShot(p.slug);
                    const active = p.slug === shelf;
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setShelf(p.slug)}
                        className={`kit-choice ${active ? "is-on" : ""}`}
                      >
                        {shot && (
                          <span className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-paper">
                            <Image src={shot.src} alt="" fill sizes="(min-width:1024px) 160px, 30vw" className="object-cover" />
                          </span>
                        )}
                        <span className="mt-1.5 block font-display text-[0.92rem] font-bold">
                          {p.name.replace(/^Mini | Bookshelf$/g, "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mb-2 mt-4 font-sans text-sm font-bold text-ink-800">
                  Colour: <span className="font-normal text-ink-600">{color}</span>
                </p>
                <Swatches value={color} onPick={setColor} label="Shelf colour" />
              </Step>

              <Step n={2} title="Your 12 books" note="Two sets of six. A ready-made set, or name your own six.">
                <div className="space-y-5">
                  {sets.map((s, i) => (
                    <div key={i}>
                      <p className="mb-2 font-sans text-sm font-bold text-ink-800">
                        Set {i + 1}: <span className="font-normal text-ink-600">{getProduct(s.slug)?.name}</span>
                      </p>
                      <div role="radiogroup" aria-label={`Book set ${i + 1}`} className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                        {BOOK_SETS.map((p) => {
                          const active = p.slug === s.slug;
                          const photo = p.images.find((im) => im.kind === "photo") ?? p.images[0];
                          return (
                            <button
                              key={p.slug}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => pickSet(i, p.slug)}
                              className={`kit-choice w-[7.2rem] shrink-0 ${active ? "is-on" : ""}`}
                            >
                              {photo && (
                                <span className="relative block aspect-square overflow-hidden rounded-xl bg-paper">
                                  <Image src={photo.src} alt="" fill sizes="116px" className="object-cover" />
                                </span>
                              )}
                              <span className="mt-1.5 block font-display text-[0.8rem] font-bold leading-tight">
                                {p.customSet ? "Your own six" : p.name.replace(/^Mini | Set$/g, "")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {isCustom(s.slug) && (
                        <div data-kit-titles className="stitch mt-3 bg-cream-50 p-4">
                          <SixTitlesForm
                            titles={s.titles}
                            onChange={(t) => setTitles(i, t)}
                            max={6}
                            showErrors={showErrors}
                            idPrefix={`kit-set-${i}`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Step>

              <Step n={3} title="Your plant" note="Already in your set.">
                <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-sage-600 bg-sage-100 p-3">
                  <span className="kit-icon !h-14 !w-14">
                    <Image src="/promos/set-plant.webp" alt="" width={200} height={200} sizes="56px" />
                  </span>
                  <span className="font-sans text-sm">
                    <strong className="block font-display text-[0.98rem] text-ink-900">{PLANT.name}</strong>
                    {PLANT.blurb}
                  </span>
                  <IconCheck className="ml-auto h-5 w-5 shrink-0 text-sage-700" />
                </div>
              </Step>

              <Step n={4} title="Your shelf letter" note="A little word block that tells your shelf what it is.">
                <div role="radiogroup" aria-label="Letter word" className="flex flex-wrap gap-2">
                  {WORDS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      role="radio"
                      aria-checked={w === word}
                      onClick={() => setWord(w)}
                      className={`tag tag-pick ${w === word ? "tag-sage" : "tag-taupe"}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <p className="mb-2 mt-4 font-sans text-sm font-bold text-ink-800">
                  Colour: <span className="font-normal text-ink-600">{letterColor}</span>
                </p>
                <Swatches value={letterColor} onPick={setLetterColor} label="Letter colour" />
              </Step>

              <Field label="Anything we should know? (optional)" htmlFor="kit-notes" hint="An edition you love, a gift message, a theme for the shelf.">
                <textarea
                  id="kit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className={`${inputClass} resize-y`}
                />
              </Field>

              {showErrors && titlesMissing && (
                <p className="font-sans text-sm font-bold text-rose-700" role="alert">
                  Your own six needs all six titles before the set can go in your basket.
                </p>
              )}

              {/* a desktop has room for the button in the column */}
              <div className="hidden lg:block">
                <Button onClick={add} className="btn-lg w-full">
                  {label}
                </Button>
                <p className="mt-2 text-center font-sans text-sm text-ink-600">
                  Made together, packed together in our illustrated box.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className="kit-tray lg:hidden">
        <Button onClick={add} className="btn-lg w-full">
          {label}
        </Button>
      </div>
    </div>
  );
}
