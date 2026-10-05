import { getProduct } from "./catalog";
import { lineUnitPrice, shippableSubtotal, type Cart, type CartLine } from "./cart";
import { formatMoney, type Cents } from "./money";
import { PROMO } from "./promo";

/**
 * The shop's discount codes: a handful of fixed codes. Each is either a
 * percentage off the lines it covers, or an amount off an order that reaches a
 * minimum within a window of dates (the promos in promo.ts).
 *
 * Fixed rather than per-customer on purpose. A per-customer code needs a
 * table of issued codes; a shared code is what every shop this size actually
 * runs. The price is only ever computed on the server from this file, so a
 * made-up code or an edited request cannot buy a bigger discount than this.
 *
 * Shipping is worked out on the subtotal before the discount, so a code never
 * costs a customer the free-shipping threshold they had already reached.
 *
 * There is no welcome code: signups join the mailing list, and a code reaches
 * them by email only when the shop is running one. WELCOME5 was retired on
 * 2026-09-24 and now reads as any unknown code.
 */

/** A standalone mini book set, named or custom. A bundle's set is priced into the bundle. */
const isBookSet = (line: CartLine) => line.type === "product" && Boolean(getProduct(line.slug)?.setOfSix);

const peso = (cents: Cents) => formatMoney(cents).replace(/\.00$/, "");

type Rule =
  | {
      kind: "percent";
      percent: number;
      covers: (line: CartLine) => boolean;
      label: string;
      /** what to say when the basket has nothing the code covers */
      needs: string;
    }
  | {
      kind: "amount";
      amount: Cents;
      /**
       * Counted on what the courier carries, never on gift cards: a gift card
       * is money, and ₱100 off ₱2,000 of it would be selling money at a loss.
       */
      minimum: Cents;
      starts: string;
      ends: string;
      label: string;
    };

const CODES: Record<string, Rule> = {
  BOOKSET10: {
    kind: "percent",
    percent: 10,
    covers: isBookSet,
    label: "10% off your mini book sets applied.",
    needs: "That code is for mini book sets. Add a set to use it.",
  },
  [PROMO.code]: {
    kind: "amount",
    amount: PROMO.amountOff,
    minimum: PROMO.minimum,
    starts: PROMO.starts,
    ends: PROMO.ends,
    label: `${peso(PROMO.amountOff)} off applied, and shipping is free. Enjoy your 10.10 treat!`,
  },
};

const inWindow = (rule: Rule, now: Date) =>
  rule.kind !== "amount" || (now >= new Date(rule.starts) && now < new Date(rule.ends));

/** Codes are typed by hand, so spaces and case are forgiven. */
export function normalizeCode(raw: string | undefined | null): string {
  return (raw ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 20);
}

/** A code the shop is running right now. A promo outside its dates is not one. */
export function isValidCode(raw: string | undefined | null, now = new Date()): boolean {
  const rule = CODES[normalizeCode(raw)];
  return Boolean(rule) && inWindow(rule, now);
}

/** What the checkout says once a code is applied. */
export function codeLabel(raw: string | undefined | null): string {
  return CODES[normalizeCode(raw)]?.label ?? "";
}

/**
 * Why a code typed at checkout takes nothing off, in the shop's words: not one
 * of ours, not started, over, or the basket is not there yet.
 */
export function codeHint(raw: string | undefined | null, cart: Cart, now = new Date()): string {
  const code = normalizeCode(raw);
  const rule = CODES[code];
  if (!rule) return "That code isn't one of ours.";
  if (rule.kind === "percent") return rule.needs;
  if (now < new Date(rule.starts)) return `${code} starts on ${PROMO.firstDay}.`;
  if (now >= new Date(rule.ends)) return `${code} ended on ${PROMO.lastDay}. Thank you for shopping the 10.10 treat!`;
  const short = rule.minimum - shippableSubtotal(cart);
  const gifts = cart.lines.some((l) => l.type === "product" && getProduct(l.slug)?.digital);
  return `Add ${peso(short)} more to use ${code}${gifts ? " (gift cards don't count towards it)" : ""}.`;
}

/** Whole centavos, rounded down: the shop never over-discounts by rounding. */
export function discountFor(code: string | undefined | null, cart: Cart, now = new Date()): Cents {
  const rule = CODES[normalizeCode(code)];
  if (!rule || !inWindow(rule, now)) return 0;
  if (rule.kind === "amount") {
    const products = shippableSubtotal(cart);
    return products >= rule.minimum ? Math.min(rule.amount, products) : 0;
  }
  const covered = cart.lines
    .filter(rule.covers)
    .reduce((sum, line) => sum + lineUnitPrice(line) * line.qty, 0);
  return covered > 0 ? Math.floor((covered * rule.percent) / 100) : 0;
}
