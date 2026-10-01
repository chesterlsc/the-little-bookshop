import Image from "next/image";
import { GIFT_CARD_AMOUNTS, GIFT_CARD_BACK, giftCardArt } from "@/lib/catalog";
import type { Cents } from "@/lib/money";

/**
 * The shop's own gift card artwork, shown whole, with live text written onto
 * the lines the art leaves blank.
 *
 * The cards are the artwork cut out of its margin (1499 × 963), and every
 * overlay below is a percentage of that, so the writing lands on the printed
 * lines at any size. Type is sized in container units for the same reason.
 * Whatever is written here is real, selectable text: a code can be copied
 * straight off the card.
 */

const FRAME = "gift-art relative block aspect-[1499/963] w-full overflow-hidden rounded-[4.1%/6.4%]";
const HAND = "story-line absolute truncate leading-none text-ink-800";

/** The front, for one of the three amounts. All three stay mounted so changing amount never waits on a download. */
export function GiftCardFront({
  price,
  toName,
  fromName,
  sizes,
  eager = false,
  className = "",
}: {
  price: Cents;
  toName?: string;
  fromName?: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <span className={`${FRAME} ${className}`}>
      {GIFT_CARD_AMOUNTS.map((a) => (
        <Image
          key={a.price}
          src={giftCardArt(a.price)}
          alt={a.price === price ? `The Little Bookshop gift card for ${a.label}` : ""}
          aria-hidden={a.price !== price}
          fill
          sizes={sizes}
          loading={eager ? "eager" : undefined}
          className={`object-contain ${a.price === price ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {/* the art's own "To:" and "From:" lines */}
      {toName && <span className={`${HAND} left-[20.2%] top-[83.2%] w-[26%] text-[3.1cqw]`}>{toName}</span>}
      {fromName && <span className={`${HAND} left-[62.4%] top-[83.2%] w-[23%] text-[3.1cqw]`}>{fromName}</span>}
    </span>
  );
}

/** The back, with the code written into its "Gift card code" box. */
export function GiftCardBack({
  code,
  toName,
  fromName,
  sizes,
  className = "",
}: {
  code?: string;
  toName?: string;
  fromName?: string;
  sizes: string;
  className?: string;
}) {
  return (
    <span className={`${FRAME} ${className}`}>
      <Image src={GIFT_CARD_BACK} alt="The back of the gift card, with how to use it" fill sizes={sizes} className="object-contain" />
      {toName && <span className={`${HAND} left-[63%] top-[38%] w-[27%] text-[3cqw]`}>{toName}</span>}
      {fromName && <span className={`${HAND} left-[65.4%] top-[45.9%] w-[25%] text-[3cqw]`}>{fromName}</span>}
      {code && (
        <span className="absolute left-[57.1%] top-[62.1%] flex h-[11.2%] w-[34.3%] select-all items-center justify-center whitespace-nowrap font-mono text-[3.3cqw] font-bold tracking-[0.04em] text-ink-900">
          {code}
        </span>
      )}
    </span>
  );
}
