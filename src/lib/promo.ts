import type { Cents } from "./money";

/**
 * The promo the shop is running, in one place: the code's rules in
 * discount.ts, the ribbon, the home band, the basket nudge and the email all
 * read this. The next promo is an edit here, not a hunt through the site.
 *
 * The window is checked against the clock wherever it matters: on the server
 * for the money, and in the browser for the words, so the promo switches
 * itself on and off at midnight in Manila with no deploy.
 */
export const PROMO = {
  code: "BOOKISH10",
  /** taken off once the order reaches `minimum` */
  amountOff: 10000 as Cents,
  /** what the products come to: the free-shipping line, so both unlock together */
  minimum: 199900 as Cents,
  /** 5 October, 00:00 in Manila */
  starts: "2026-10-04T16:00:00.000Z",
  /** the end of 11 October in Manila */
  ends: "2026-10-11T16:00:00.000Z",
  name: "A little 10.10 treat",
  dates: "October 5–11",
  firstDay: "5 October",
  lastDay: "11 October",
  image: {
    src: "/promos/bookish10.webp",
    /** mail apps do not all read webp */
    email: "/promos/bookish10.jpg",
    width: 988,
    height: 1604,
    alt: "A little 10.10 treat: ₱100 off orders ₱1,999 and up, plus free shipping, with code BOOKISH10, October 5 to 11",
  },
} as const;

export const promoLive = (now = new Date()) => now >= new Date(PROMO.starts) && now < new Date(PROMO.ends);

/** Whole days left, counting today: "3 days left" on the 9th. */
export function promoDaysLeft(now = new Date()): number {
  return Math.max(0, Math.ceil((new Date(PROMO.ends).getTime() - now.getTime()) / 86_400_000));
}
