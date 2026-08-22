import { SET_SIZE, getProduct, getVariant, SHELF_THEMES, type ShelfThemeId } from "./catalog";
import type { Cents } from "./money";

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
}

export type CartLine = ProductLine | BundleLine;

/** A line being added to the cart; the key is assigned by the cart itself. */
export type NewCartLine = (Omit<ProductLine, "key"> | Omit<BundleLine, "key">) & {
  key?: string;
};

export interface Cart {
  lines: CartLine[];
}

export const EMPTY_CART: Cart = { lines: [] };

/* ─── Validation ───────────────────────────────────────────────────────────── */

export function validTitles(titles: CustomTitle[] | undefined): boolean {
  return (
    Array.isArray(titles) &&
    titles.length === SET_SIZE &&
    titles.every((t) => typeof t?.title === "string" && t.title.trim().length > 0)
  );
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
        issues.push({ key: line.key, message: "This item is no longer in the catalog." });
        continue;
      }
      if (!variant.available) {
        issues.push({ key: line.key, message: `${product.name} is currently unavailable.` });
      }
      if (product.customSet && !validTitles(line.titles)) {
        issues.push({
          key: line.key,
          message: `${product.name} needs exactly ${SET_SIZE} book titles before checkout.`,
        });
      }
      if (product.customSingle && !line.singleTitle?.trim()) {
        issues.push({
          key: line.key,
          message: `${product.name} needs the book title you would like made.`,
        });
      }
    } else {
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
          message: `This bundle's custom set needs exactly ${SET_SIZE} book titles.`,
        });
      }
      for (const acc of line.accessories) {
        const a = getProduct(acc.slug);
        const av = a && getVariant(a, acc.variantId);
        if (!a || !av || a.category !== "accessories") {
          issues.push({ key: line.key, message: "An accessory in this bundle is unavailable." });
        }
      }
      if (line.themeId && !SHELF_THEMES.some((t) => t.id === line.themeId)) {
        issues.push({ key: line.key, message: "This bundle's shelf theme is not recognized." });
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
    return variant?.price ?? 0;
  }
  const shelf = getProduct(line.shelf.slug);
  const shelfVar = shelf && getVariant(shelf, line.shelf.variantId);
  const set = getProduct(line.set.slug);
  const setVar = set && getVariant(set, line.set.variantId);
  let total = (shelfVar?.price ?? 0) + (setVar?.price ?? 0);
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

export function cartCount(cart: Cart): number {
  return cart.lines.reduce((sum, line) => sum + line.qty, 0);
}

/** Orders at or above this subtotal ship free. */
export const FREE_SHIPPING_MINIMUM: Cents = Number(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_MINIMUM_CENTS ?? 99900,
);

/**
 * Flat shipping, configurable via env. Real carrier rates are a business
 * decision (see README); the free-shipping threshold is set above.
 */
export function shippingFor(subtotal: Cents): Cents {
  const flat = Number(process.env.NEXT_PUBLIC_FLAT_SHIPPING_CENTS ?? 12000);
  if (subtotal <= 0) return 0;
  if (subtotal >= FREE_SHIPPING_MINIMUM) return 0;
  return flat;
}

export function describeLine(line: CartLine): string {
  if (line.type === "product") {
    const product = getProduct(line.slug);
    return product?.name ?? line.slug;
  }
  const shelf = getProduct(line.shelf.slug);
  return `Little Shelf Bundle: ${shelf?.name ?? "shelf"}`;
}

let counter = 0;
export function newLineKey(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.floor(
    Math.random() * 1e6,
  ).toString(36)}`;
}
