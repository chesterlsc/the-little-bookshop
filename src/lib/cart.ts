import { MAX_TITLES, SET_SIZE, SHELF_SET, getProduct, getVariant, SHELF_THEMES, type ShelfThemeId } from "./catalog";
import { formatMoney, type Cents } from "./money";
import { EMAIL_RE, GIFT_NAME_MAX, GIFT_NOTE_MAX, type GiftDetails } from "./gift-card-types";

/** One custom mini-book request. Title required; author helps us find the right cover. */
export interface CustomTitle {
  title: string;
  author: string;
}

export interface ProductLine {
  type: "product";
  key: string;
  slug: string;
  variantId: string;
  qty: number;
  /** exactly six titles, for custom mini book sets */
  titles?: CustomTitle[];
  /** one title, for the personalized keychain */
  singleTitle?: string;
  notes?: string;
  /** who a gift card is for, and how it reaches them */
  gift?: GiftDetails;
}

export interface BundlePart {
  slug: string;
  variantId: string;
}

export interface BundleLine {
  type: "bundle";
  key: string;
  qty: number;
  shelf: BundlePart;
  set: BundlePart & { titles?: CustomTitle[] };
  accessories: BundlePart[];
  themeId?: ShelfThemeId;
  notes?: string;
  /** the Little Shelf Set: a fixed price, and a second book set */
  kit?: typeof SHELF_SET.slug;
  extraSets?: (BundlePart & { titles?: CustomTitle[] })[];
}

/** The Little Shelf Set, rather than a shelf built up piece by piece. */
export const isShelfSet = (line: CartLine) => line.type === "bundle" && line.kit === SHELF_SET.slug;

export type CartLine = ProductLine | BundleLine;

/** A line being added to the cart; the key is assigned by the cart itself. */
export type NewCartLine = (Omit<ProductLine, "key"> | Omit<BundleLine, "key">) & {
  key?: string;
};

export interface Cart {
  lines: CartLine[];
}

export const EMPTY_CART: Cart = { lines: [] };

/* ─── Gift cards ───────────────────────────────────────────────────────────── */

/**
 * A gift card line: digital, so nothing about it is ever posted. A plain
 * boolean, not a type guard: a guard would tell the compiler every other line
 * is a bundle.
 */
export function isGiftCard(line: CartLine): boolean {
  return line.type === "product" && Boolean(getProduct(line.slug)?.digital);
}

/** Who a gift card line is for; undefined on every other line. */
export const giftOf = (line: CartLine): GiftDetails | undefined =>
  isGiftCard(line) ? (line as ProductLine).gift : undefined;

export const hasGiftCard = (cart: Cart) => cart.lines.some(isGiftCard);

/** Nothing to post in this basket at all, so no address is needed. */
export const isDigitalOnly = (cart: Cart) => cart.lines.length > 0 && cart.lines.every(isGiftCard);

/** "To Ana · emailed to ana@example.com", or where the buyer's own card goes. */
export function giftSummary(gift: GiftDetails | undefined): string {
  if (gift?.delivery !== "friend") return "Emailed to you";
  return `${gift.toName ? `To ${gift.toName} · ` : ""}emailed to ${gift.toEmail}`;
}

/** The typed half of a gift card line, checked wherever a basket is checked. */
function giftIssue(line: ProductLine): string | undefined {
  // one card, one code, one person: a second card is a second line
  if (line.qty !== 1) return "Gift cards are added one at a time.";
  const g = line.gift;
  if (!g || (g.delivery !== "self" && g.delivery !== "friend")) return "Please choose who this gift card is for.";
  const long = (v: string | undefined, max: number) => (v ?? "").length > max;
  if (long(g.toName, GIFT_NAME_MAX) || long(g.fromName, GIFT_NAME_MAX)) return "Please keep the names on the gift card short.";
  if (long(g.note, GIFT_NOTE_MAX)) return `Please keep the gift card note under ${GIFT_NOTE_MAX} characters.`;
  if (g.delivery === "friend" && !EMAIL_RE.test((g.toEmail ?? "").trim()))
    return "This gift card needs your friend's email so we know where to send it.";
  return undefined;
}

/* ─── Validation ───────────────────────────────────────────────────────────── */

/**
 * The set is sold at its own price, so its contents are checked exactly: one
 * Regular shelf, two sets of six (a custom set is six titles, not more), the
 * plant and one shelf letter. Anything else would be a cheaper way to buy more.
 */
function shelfSetIssue(line: BundleLine): string | undefined {
  const broken = "This Little Shelf Set has changed. Please remove it and choose it again.";
  if (line.kit !== SHELF_SET.slug) return broken;
  const shelfVar = getVariant(getProduct(line.shelf.slug)!, line.shelf.variantId);
  if (shelfVar?.options.Size !== "Regular") return "The Little Shelf Set comes with a Regular shelf.";
  const sets = [line.set, ...(Array.isArray(line.extraSets) ? line.extraSets : [])];
  if (sets.length !== SHELF_SET.setsInIt) return broken;
  for (const s of sets) {
    const p = getProduct(s?.slug ?? "");
    if (!p || !getVariant(p, s.variantId) || p.category !== "mini-books") return broken;
    if (p.customSet && (!validTitles(s.titles) || s.titles!.length !== SET_SIZE))
      return "Each custom set in the Little Shelf Set needs its six titles.";
  }
  const slugs = line.accessories.map((a) => a.slug).sort().join();
  if (slugs !== [SHELF_SET.letterSlug, SHELF_SET.plantSlug].sort().join()) return broken;
  return undefined;
}

/** Books are made six at a time, so a custom line is six, twelve, eighteen… */
export function validTitles(titles: CustomTitle[] | undefined): boolean {
  return (
    Array.isArray(titles) &&
    titles.length >= SET_SIZE &&
    titles.length <= MAX_TITLES &&
    titles.length % SET_SIZE === 0 &&
    titles.every((t) => typeof t?.title === "string" && t.title.trim().length > 0)
  );
}

/**
 * How many sets of six a line of titles is, and so how many times its price
 * counts. Rounds up, so a length validation would reject can never be cheaper
 * than the books it asks for.
 */
export function setsOf(titles: CustomTitle[] | undefined): number {
  return Math.max(1, Math.ceil((titles?.length ?? 0) / SET_SIZE));
}

export interface LineIssue {
  key: string;
  message: string;
}

/**
 * Validates a cart against the catalog. Used on the client for guidance and on
 * the server as the source of truth before any order is created.
 */
export function validateCart(cart: Cart): LineIssue[] {
  const issues: LineIssue[] = [];
  if (!cart.lines.length) {
    issues.push({ key: "", message: "Your cart is empty." });
    return issues;
  }
  for (const line of cart.lines) {
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > 50) {
      issues.push({ key: line.key, message: "Quantity must be between 1 and 50." });
      continue;
    }
    if (line.type === "product") {
      const product = getProduct(line.slug);
      const variant = product && getVariant(product, line.variantId);
      if (!product || !variant) {
        issues.push({
          key: line.key,
          message: product
            ? `${product.name} has new options. Please remove it and add it again.`
            : "This item is no longer in the catalog.",
        });
        continue;
      }
      if (!variant.available) {
        issues.push({ key: line.key, message: `${product.name} is currently unavailable.` });
      }
      if (product.customSet && !validTitles(line.titles)) {
        issues.push({
          key: line.key,
          message: `${product.name} needs a title in every slot, in sets of ${SET_SIZE}.`,
        });
      }
      if (product.customSingle && !line.singleTitle?.trim()) {
        issues.push({
          key: line.key,
          message: `${product.name} needs the book title you would like made.`,
        });
      }
      if (product.digital) {
        const message = giftIssue(line);
        if (message) issues.push({ key: line.key, message });
      }
    } else {
      // The cart arrives as untrusted JSON on the checkout route, so the types
      // above are a claim, not a fact. Reject a shape we don't recognize rather
      // than reading through it and turning a bad request into a 500.
      const b = line as Partial<BundleLine>;
      if (b.type !== "bundle" || !b.shelf || !b.set || !Array.isArray(b.accessories)) {
        issues.push({ key: line.key, message: "This item is no longer in the catalog." });
        continue;
      }
      const shelf = getProduct(line.shelf.slug);
      const shelfVar = shelf && getVariant(shelf, line.shelf.variantId);
      const set = getProduct(line.set.slug);
      const setVar = set && getVariant(set, line.set.variantId);
      if (!shelf || !shelfVar || shelf.category !== "bookshelves") {
        issues.push({ key: line.key, message: "This bundle's shelf is no longer available." });
        continue;
      }
      if (!set || !setVar || set.category !== "mini-books") {
        issues.push({ key: line.key, message: "This bundle's book set is no longer available." });
        continue;
      }
      if (set.customSet && !validTitles(line.set.titles)) {
        issues.push({
          key: line.key,
          message: `This bundle's custom set needs a title in every slot, in sets of ${SET_SIZE}.`,
        });
      }
      for (const acc of line.accessories) {
        const a = getProduct(acc.slug);
        const av = a && getVariant(a, acc.variantId);
        if (!a || !av || a.category !== "accessories") {
          issues.push({
            key: line.key,
            message:
              a && !av
                ? `${a.name} in this bundle has new options. Please remove the bundle and build it again.`
                : "An accessory in this bundle is unavailable.",
          });
        }
      }
      if (line.themeId && !SHELF_THEMES.some((t) => t.id === line.themeId)) {
        issues.push({ key: line.key, message: "This bundle's shelf theme is not recognized." });
      }
      if (b.kit !== undefined) {
        const message = shelfSetIssue(line);
        if (message) issues.push({ key: line.key, message });
      }
    }
  }
  return issues;
}

/* ─── Pricing (prices always come from the catalog, never the client) ─────── */

export function lineUnitPrice(line: CartLine): Cents {
  if (line.type === "product") {
    const product = getProduct(line.slug);
    const variant = product && getVariant(product, line.variantId);
    // every six books is another set, at the set's price
    return (variant?.price ?? 0) * (product?.customSet ? setsOf(line.titles) : 1);
  }
  // the set's own price, whatever its parts would come to
  if (isShelfSet(line)) return SHELF_SET.price;
  const shelf = getProduct(line.shelf.slug);
  const shelfVar = shelf && getVariant(shelf, line.shelf.variantId);
  const set = getProduct(line.set.slug);
  const setVar = set && getVariant(set, line.set.variantId);
  let total =
    (shelfVar?.price ?? 0) + (setVar?.price ?? 0) * (set?.customSet ? setsOf(line.set.titles) : 1);
  for (const acc of line.accessories) {
    const a = getProduct(acc.slug);
    const av = a && getVariant(a, acc.variantId);
    total += av?.price ?? 0;
  }
  return total;
}

export function cartSubtotal(cart: Cart): Cents {
  return cart.lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.qty, 0);
}

/**
 * What the courier actually carries. Shipping, and the free-shipping line, are
 * worked out on this: a gift card is an email, and buying one should neither
 * cost a shipping fee nor buy free shipping for the parcel beside it.
 */
export function shippableSubtotal(cart: Cart): Cents {
  return cart.lines.reduce((sum, line) => (isGiftCard(line) ? sum : sum + lineUnitPrice(line) * line.qty), 0);
}

export function cartCount(cart: Cart): number {
  return cart.lines.reduce((sum, line) => sum + line.qty, 0);
}

/**
 * Orders at or above this subtotal ship free. Set where the shop can still
 * carry the cost: a good share of orders go to the provinces, where the courier
 * charges more than it does across the city.
 *
 * A flat number rather than an env var on purpose: NEXT_PUBLIC_ values are
 * baked in at build time, so a stale one set on the host would quietly outrank
 * this file and keep quoting the old threshold to customers. The shop's own
 * figure belongs with the prices it is measured against, and the ribbon, the
 * basket and the shipping policy all read it from here.
 */
export const FREE_SHIPPING_MINIMUM: Cents = 199900;

/**
 * Flat shipping, configurable via env. Real carrier rates are a business
 * decision (see README); the free-shipping threshold is set above.
 * Pass `shippableSubtotal`, not the whole basket: gift cards do not ship.
 */
export function shippingFor(subtotal: Cents): Cents {
  const flat = Number(process.env.NEXT_PUBLIC_FLAT_SHIPPING_CENTS ?? 12000);
  if (subtotal <= 0) return 0;
  if (subtotal >= FREE_SHIPPING_MINIMUM) return 0;
  return flat;
}

/** Named with their options in the checkout summary; everything else shows its name only. */
const SUMMARY_WITH_OPTIONS = ["mini-shelf-letters", "mini-plant"];

function nameWithOptions(slug: string, variantId: string): string {
  const product = getProduct(slug);
  const variant = product && getVariant(product, variantId);
  const opts = variant ? Object.values(variant.options).join(", ") : "";
  return `${product?.name ?? slug}${opts ? ` (${opts})` : ""}`;
}

export function describeLine(line: CartLine): string {
  if (isGiftCard(line)) return `Gift card · ${formatMoney(lineUnitPrice(line)).replace(/\.00$/, "")}`;
  if (line.type === "product") {
    return SUMMARY_WITH_OPTIONS.includes(line.slug)
      ? nameWithOptions(line.slug, line.variantId)
      : (getProduct(line.slug)?.name ?? line.slug);
  }
  const shelf = getProduct(line.shelf.slug);
  const extras = line.accessories
    .filter((a) => SUMMARY_WITH_OPTIONS.includes(a.slug))
    .map((a) => `, ${nameWithOptions(a.slug, a.variantId)}`);
  return `${isShelfSet(line) ? SHELF_SET.name : "Little Shelf Bundle"}: ${shelf?.name ?? "shelf"}${extras.join("")}`;
}

let counter = 0;
export function newLineKey(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.floor(
    Math.random() * 1e6,
  ).toString(36)}`;
}
