import type { Cents } from "./money";

/**
 * The welcome discount: one fixed code, five percent off the items.
 *
 * Fixed rather than per-customer on purpose. A per-customer code needs a
 * table of issued codes, and this shop keeps no database; a shared welcome
 * code is also what every shop this size actually runs. The price is only
 * ever computed on the server from this file, so a made-up code or an edited
 * request cannot buy a bigger discount than this.
 *
 * Shipping is worked out on the subtotal before the discount, so five percent
 * off never costs a customer the free-shipping threshold they had already
 * reached.
 */
export const WELCOME_CODE = "WELCOME5";
export const WELCOME_PERCENT = 5;

/** Codes are typed by hand, so spaces and case are forgiven. */
export function normalizeCode(raw: string | undefined | null): string {
  return (raw ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 20);
}

export function isValidCode(raw: string | undefined | null): boolean {
  return normalizeCode(raw) === WELCOME_CODE;
}

/** Whole centavos, rounded down: the shop never over-discounts by rounding. */
export function discountFor(code: string | undefined | null, subtotal: Cents): Cents {
  if (!isValidCode(code) || subtotal <= 0) return 0;
  return Math.floor((subtotal * WELCOME_PERCENT) / 100);
}
