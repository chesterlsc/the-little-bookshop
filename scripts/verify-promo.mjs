/**
 * The promo code's rules, at the edges of its dates and its minimum, without
 * waiting for the calendar.
 *
 *   npm run verify:promo
 */
import { codeHint, discountFor, isValidCode } from "../src/lib/discount.ts";
import { PROMO, promoDaysLeft, promoLive } from "../src/lib/promo.ts";

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !extra ? "" : "  → " + extra}`);
};
const at = (iso) => new Date(iso);
const line = (slug, variantId, qty = 1, extra = {}) => ({ type: "product", key: slug + qty, slug, variantId, qty, ...extra });
const shelves = (n) => ({ lines: [line("mini-classic-bookshelf", "regular|choco-brown", n)] }); // ₱975 each
const DURING = at("2026-10-08T04:00:00.000Z");

check("off before 5 October in Manila", !promoLive(at("2026-10-04T15:59:59.000Z")) && discountFor(PROMO.code, shelves(3), at("2026-10-04T15:59:59.000Z")) === 0);
check("on from midnight, 5 October in Manila", promoLive(at("2026-10-04T16:00:00.000Z")) && discountFor(PROMO.code, shelves(3), at("2026-10-04T16:00:00.000Z")) === 10000);
check("still on at 11:59 pm on 11 October", discountFor(PROMO.code, shelves(3), at("2026-10-11T15:59:59.000Z")) === 10000);
check("off from midnight, 12 October", discountFor(PROMO.code, shelves(3), at("2026-10-11T16:00:00.000Z")) === 0 && !isValidCode(PROMO.code, at("2026-10-11T16:00:00.000Z")));
check("₱100 off at ₱1,999 and over, nothing under it",
  discountFor(PROMO.code, shelves(2), DURING) === 0 // ₱1,950
  && discountFor(PROMO.code, shelves(3), DURING) === 10000);
check("gift cards don't count towards it",
  discountFor(PROMO.code, { lines: [...shelves(1).lines, line("gift-card", "2000", 1, { gift: { delivery: "self" } })] }, DURING) === 0);
check("typed loosely, it still works", discountFor(" bookish 10 ", shelves(3), DURING) === 10000);
check("under the minimum it says how much more", /Add ₱49 more to use BOOKISH10/.test(codeHint(PROMO.code, shelves(2), DURING)), codeHint(PROMO.code, shelves(2), DURING));
check("before and after, it says when", /starts on 5 October/.test(codeHint(PROMO.code, shelves(3), at("2026-10-01T00:00:00Z")))
  && /ended on 11 October/.test(codeHint(PROMO.code, shelves(3), at("2026-10-20T00:00:00Z"))));
check("days left counts today", promoDaysLeft(at("2026-10-11T04:00:00Z")) === 1 && promoDaysLeft(at("2026-10-05T04:00:00Z")) === 7);
check("BOOKSET10 is untouched", discountFor("BOOKSET10", { lines: [line("custom-mini-book-set", "front-back-spine", 1, { titles: Array.from({ length: 6 }, (_, i) => ({ title: `B${i}`, author: "" })) })] }, DURING) === 4290);

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
