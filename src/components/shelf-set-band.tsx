import Image from "next/image";
import { SHELF_SET, shelfSetWorth } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { Sparkle } from "./illustrations";
import { ButtonLink } from "./ui";

/**
 * The Little Shelf Set, sold where it is seen: a band right under the home
 * page's first screen, and a smaller "make it a set" card on each shelf's page.
 * Both read their numbers from the catalog, so the price and the saving can
 * never disagree with the checkout.
 */

const peso = (cents: number) => formatMoney(cents).replace(/\.00$/, "");
const SET_PAGE = `/products/${SHELF_SET.slug}`;

/** The four things, added up the way the poster adds them: shelf + books + plant + letter = ₱1,799. */
export function Equation({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={`kit-sum ${compact ? "kit-sum-compact" : "enter-stagger"}`} aria-label="What's in the set">
      {SHELF_SET.includes.map((item, i) => (
        <li key={item.label} style={{ "--i": i } as React.CSSProperties}>
          <span className="kit-icon">
            <Image src={item.icon} alt="" width={200} height={200} sizes="72px" />
          </span>
          <span className="kit-sum-label">{item.label}</span>
          {!compact && <span className="kit-sum-detail">{item.detail}</span>}
        </li>
      ))}
      <li className="kit-sum-total" style={{ "--i": 4 } as React.CSSProperties}>
        <span className="kit-price">{peso(SHELF_SET.price)}</span>
      </li>
    </ol>
  );
}

export function ShelfSetBand() {
  const most = shelfSetWorth();
  return (
    <section aria-labelledby="set-title" className="set-band relative overflow-hidden">
      <svg viewBox="0 0 40 40" aria-hidden className="promo-twinkle absolute left-[6%] top-10 h-6 w-6">
        <Sparkle x={20} y={20} s={9} />
      </svg>
      <svg viewBox="0 0 40 40" aria-hidden className="promo-twinkle promo-twinkle-2 absolute bottom-14 right-[8%] h-5 w-5">
        <Sparkle x={20} y={20} s={9} />
      </svg>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:px-8 lg:py-16">
        <div className="text-center lg:text-left">
          <p className="font-sans text-[0.78rem] font-black uppercase tracking-[0.22em] text-rose-600">
            New · everything in one go
          </p>
          <h2 id="set-title" className="mt-2 font-display text-[clamp(2.2rem,7vw,3.6rem)] font-bold leading-[1.02] text-ink-900">
            <span className="kit-brush">The Little Shelf Set</span>
          </h2>
          <p className="story-line mt-3 text-[1.1rem] text-ink-600">Everything you need to build your little shelf.</p>

          <div className="mt-6">
            <Equation />
          </div>
          <p className="mt-3 font-sans text-sm text-ink-600">
            Worth up to <s>{peso(most)}</s> bought one by one. <strong className="text-sage-800">Save up to {peso(most - SHELF_SET.price)}.</strong>
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5 lg:justify-start">
            <ButtonLink href={SET_PAGE} className="btn-lg">
              Build my set
            </ButtonLink>
            <ButtonLink href={SET_PAGE} variant="quiet" className="btn-lg">
              See what&apos;s inside
            </ButtonLink>
          </div>
          <p className="mt-3 font-sans text-xs text-ink-600">
            Choose the shelf&apos;s style and colour, your twelve books, and your letter. Packed together in our illustrated box.
          </p>
          {/* on a phone the poster follows the button: the offer first, then the picture of it */}
          <div className="set-band-poster mx-auto mt-8 w-[15.5rem] lg:hidden">
            <Image
              src={SHELF_SET.poster.src}
              alt="The Little Shelf Set poster: two styled shelves and everything the set includes, ₱1,799"
              width={SHELF_SET.poster.width}
              height={SHELF_SET.poster.height}
              sizes="248px"
              className="rounded-[1.2rem]"
            />
          </div>

        </div>

        <div className="set-band-poster relative hidden justify-self-center lg:block">
          <span aria-hidden className="set-band-sticker">
            <span>New</span>
          </span>
          <Image
            src={SHELF_SET.poster.src}
            alt="The Little Shelf Set poster: two styled shelves and everything the set includes, ₱1,799"
            width={SHELF_SET.poster.width}
            height={SHELF_SET.poster.height}
            sizes="380px"
            className="w-[23rem] rounded-[1.4rem]"
          />
        </div>
      </div>
    </section>
  );
}

/** On a shelf's own page: the same shelf, as the whole set. */
export function ShelfSetCrossSell({ shelfSlug }: { shelfSlug: string }) {
  const save = shelfSetWorth(shelfSlug) - SHELF_SET.price;
  return (
    <aside className="kit-cross mt-6" aria-labelledby="kit-cross-title">
      <p className="font-sans text-[0.72rem] font-black uppercase tracking-[0.2em] text-rose-600">Make it a set</p>
      <p id="kit-cross-title" className="mt-1 font-display text-[1.15rem] font-bold leading-snug text-ink-900">
        This shelf, 12 books, a plant and a letter: {peso(SHELF_SET.price)}
      </p>
      <div className="mt-3">
        <Equation compact />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <ButtonLink href={`${SET_PAGE}?shelf=${shelfSlug}`} variant="blush">
          Build it as a set
        </ButtonLink>
        {save > 0 && <span className="font-sans text-sm font-bold text-sage-800">Save {peso(save)}</span>}
      </div>
    </aside>
  );
}
