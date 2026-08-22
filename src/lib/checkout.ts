import { getProduct, getVariant, SHELF_THEMES } from "./catalog";
import { cartSubtotal, lineUnitPrice, shippingFor, validateCart, type Cart, type CartLine } from "./cart";
import type { Cents } from "./money";

/** Customer details collected at checkout; only what the order needs. */
export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  deliveryNotes: string;
  orderNotes: string;
}

export const EMPTY_CUSTOMER: CustomerInfo = {
  fullName: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  deliveryNotes: "",
  orderNotes: "",
};

export type FieldErrors = Partial<Record<keyof CustomerInfo, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateCustomer(c: Partial<CustomerInfo>): FieldErrors {
  const errors: FieldErrors = {};
  const need = (key: keyof CustomerInfo, label: string, max = 120) => {
    const v = (c[key] ?? "").trim();
    if (!v) errors[key] = `Please add ${label}.`;
    else if (v.length > max) errors[key] = `That ${label} looks too long.`;
  };
  need("fullName", "your full name");
  need("email", "your email address");
  if (!errors.email && !EMAIL_RE.test(c.email!.trim()))
    errors.email = "That email address doesn't look right.";
  need("phone", "a phone number", 40);
  need("address1", "a street address", 200);
  need("city", "a city", 100);
  need("postalCode", "a postal code", 20);
  need("country", "a country", 80);
  for (const key of ["address2", "region", "deliveryNotes", "orderNotes"] as const) {
    if ((c[key] ?? "").length > 500) errors[key] = "Please keep this under 500 characters.";
  }
  return errors;
}

/* ─── Order snapshot (expanded server-side at order time) ─────────────────── */

export interface SnapshotItem {
  kind: "product" | "bundle";
  name: string;
  qty: number;
  unitPrice: Cents;
  lineTotal: Cents;
  details: string[]; // human-readable option/config lines
  titles?: { title: string; author?: string }[];
  notes?: string;
}

export interface OrderSnapshot {
  items: SnapshotItem[];
  customer: CustomerInfo;
  subtotal: Cents;
  shipping: Cents;
  total: Cents;
  currency: string;
}

function lineDetails(line: CartLine): { name: string; details: string[]; titles?: SnapshotItem["titles"]; notes?: string } {
  if (line.type === "product") {
    const product = getProduct(line.slug)!;
    const variant = getVariant(product, line.variantId)!;
    const details = Object.entries(variant.options).map(([k, v]) => `${k}: ${v}`);
    if (product.setOfSix) details.push("Sold as a set of six");
    if (line.singleTitle) details.push(`Personalized title: ${line.singleTitle}`);
    return {
      name: product.name,
      details,
      titles: line.titles,
      notes: line.notes,
    };
  }
  const shelf = getProduct(line.shelf.slug)!;
  const shelfVar = getVariant(shelf, line.shelf.variantId)!;
  const set = getProduct(line.set.slug)!;
  const setVar = getVariant(set, line.set.variantId)!;
  const theme = SHELF_THEMES.find((t) => t.id === line.themeId);
  const details = [
    `Shelf: ${shelf.name} (${Object.values(shelfVar.options).join(", ")})`,
    `Book set: ${set.name}${setVar.options["Cover Style"] ? ` (${setVar.options["Cover Style"]})` : ""}`,
    ...line.accessories.map((a) => {
      const p = getProduct(a.slug)!;
      const v = getVariant(p, a.variantId)!;
      const opt = Object.values(v.options)[0];
      return `Extra: ${p.name}${opt ? ` (${opt})` : ""}`;
    }),
  ];
  if (theme) details.push(`Shelf theme: ${theme.name}`);
  details.push("Ships together in the illustrated box");
  return {
    name: "Little Shelf Bundle",
    details,
    titles: line.set.titles,
    notes: line.notes,
  };
}

/**
 * Validates the cart against the catalog and produces the priced snapshot.
 * All prices come from the catalog; client-sent prices are never trusted.
 */
export function buildSnapshot(
  cart: Cart,
  customer: CustomerInfo,
): { snapshot?: OrderSnapshot; issues: { key: string; message: string }[] } {
  const issues = validateCart(cart);
  if (issues.length) return { issues };
  const items: SnapshotItem[] = cart.lines.map((line) => {
    const unitPrice = lineUnitPrice(line);
    const meta = lineDetails(line);
    return {
      kind: line.type,
      name: meta.name,
      qty: line.qty,
      unitPrice,
      lineTotal: unitPrice * line.qty,
      details: meta.details,
      titles: meta.titles,
      notes: meta.notes,
    };
  });
  const subtotal = cartSubtotal(cart);
  const shipping = shippingFor(subtotal);
  return {
    issues: [],
    snapshot: {
      items,
      customer,
      subtotal,
      shipping,
      total: subtotal + shipping,
      currency: "USD",
    },
  };
}
