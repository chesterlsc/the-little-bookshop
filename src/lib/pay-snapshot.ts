import type { OrderSnapshot } from "./checkout";
import type { Cents } from "./money";

/**
 * The little bit of an order the payment screen actually needs: what to pay,
 * and what it was for. Deliberately smaller than the full OrderSnapshot — no
 * address, no phone, no email, no Instagram handle — because a copy of this
 * is kept in the browser that placed the order.
 */
export interface PaySnapshot {
  number: string;
  customerName: string;
  items: {
    name: string;
    qty: number;
    unitPrice: Cents;
    lineTotal: Cents;
    details: string[];
    titles?: { title: string; author?: string }[];
    notes?: string;
  }[];
  subtotal: Cents;
  shipping: Cents;
  total: Cents;
}

export function toPaySnapshot(number: string, snapshot: OrderSnapshot): PaySnapshot {
  return {
    number,
    customerName: snapshot.customer.fullName,
    items: snapshot.items.map((i) => ({
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      details: i.details,
      titles: i.titles,
      notes: i.notes,
    })),
    subtotal: snapshot.subtotal,
    shipping: snapshot.shipping,
    total: snapshot.total,
  };
}

const key = (number: string) => `tlb-order-${number}`;

/**
 * Keeps the just-placed order in the tab that placed it, so the payment screen
 * can always show what the customer owes.
 *
 * The server copy stays canonical; this is only read when the lookup finds
 * nothing, which is what happens when the order store is unavailable or when a
 * serverless instance without the row serves the page. Losing sight of the
 * amount right after paying is the one failure a customer cannot work around.
 */
export function rememberOrder(snap: PaySnapshot): void {
  try {
    sessionStorage.setItem(key(snap.number), JSON.stringify(snap));
  } catch {
    /* private mode or storage full: the server copy is still the real one */
  }
}

export function recallOrder(number: string): PaySnapshot | null {
  try {
    const raw = sessionStorage.getItem(key(number));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PaySnapshot;
    return parsed && parsed.number === number ? parsed : null;
  } catch {
    return null;
  }
}
