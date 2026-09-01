import { randomBytes } from "node:crypto";
import { getDb } from "./db";
import type { OrderSnapshot } from "./checkout";

/**
 * Manual-payment order lifecycle. The customer transfers the total themselves
 * and sends a screenshot on Instagram; the shop moves the order forward by
 * hand, so nothing here is ever set automatically by a payment provider.
 */
export type OrderStatus =
  | "awaiting_payment"
  | "payment_submitted"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "completed"
  | "cancelled";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "awaiting_payment",
  "payment_submitted",
  "confirmed",
  "preparing",
  "shipped",
  "completed",
];

export interface OrderRecord {
  id: number;
  number: string;
  status: OrderStatus;
  provider: string;
  /** which method the customer said they used, once they tell us */
  provider_ref: string | null;
  provider_status: string | null;
  payload: string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  emails_sent: number;
  created_at: string;
  paid_at: string | null;
}

/**
 * Order numbers are short and sequential (LB1001, LB1002, …) because customers
 * read them out in an Instagram DM. Derived from the row id inside the insert
 * transaction, so two simultaneous checkouts can never collide.
 *
 * The random suffix is the only thing guarding /order/<number>, which has no
 * login and shows the customer's home address: without it the sequential part
 * alone lets anyone read every customer's doorstep by counting upward.
 * Unambiguous alphabet (no 0/O, 1/I/L) — these get read out loud.
 */
const NUMBER_OFFSET = 1000;
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const suffix = () =>
  Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join("");

export function createOrder(snapshot: OrderSnapshot, provider = "manual"): OrderRecord {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO orders (number, status, provider, payload, subtotal, shipping, total, currency, created_at)
     VALUES (?, 'awaiting_payment', ?, ?, ?, ?, ?, ?, ?)`,
  );
  const rename = db.prepare("UPDATE orders SET number = ? WHERE id = ?");

  const tx = db.transaction((): string => {
    // a placeholder that cannot clash, swapped for the real number below
    const temp = `tmp-${randomBytes(12).toString("hex")}`;
    const info = insert.run(
      temp,
      provider,
      JSON.stringify(snapshot),
      snapshot.subtotal,
      snapshot.shipping,
      snapshot.total,
      snapshot.currency,
      new Date().toISOString(),
    );
    const number = `LB${NUMBER_OFFSET + Number(info.lastInsertRowid)}-${suffix()}`;
    rename.run(number, info.lastInsertRowid);
    return number;
  });

  return getOrder(tx())!;
}

export function getOrder(number: string): OrderRecord | undefined {
  return getDb()
    .prepare("SELECT * FROM orders WHERE number = ?")
    .get(number) as OrderRecord | undefined;
}

/** Records which method the customer says they paid with. Never a confirmation. */
export function setPaymentMethod(number: string, method: string): void {
  getDb()
    .prepare("UPDATE orders SET provider_ref = ? WHERE number = ? AND status = 'awaiting_payment'")
    .run(method, number);
}

/**
 * Moves an order along the manual flow. Used by the shop, not by the customer:
 * nothing on the storefront may set anything past `payment_submitted`.
 */
export function markStatus(number: string, status: OrderStatus, note?: string): void {
  getDb()
    .prepare(
      "UPDATE orders SET status = ?, provider_status = COALESCE(?, provider_status), paid_at = CASE WHEN ? = 'confirmed' AND paid_at IS NULL THEN ? ELSE paid_at END WHERE number = ?",
    )
    .run(status, note ?? null, status, new Date().toISOString(), number);
}

/** Claim the right to send the order emails exactly once. */
export function claimEmailSend(number: string): boolean {
  const res = getDb()
    .prepare("UPDATE orders SET emails_sent = 1 WHERE number = ? AND emails_sent = 0")
    .run(number);
  return res.changes > 0;
}

/** Undo a claim whose send failed, so a later visit can retry it. */
export function releaseEmailSend(number: string): void {
  getDb().prepare("UPDATE orders SET emails_sent = 0 WHERE number = ?").run(number);
}

export function parseSnapshot(order: OrderRecord): OrderSnapshot {
  return JSON.parse(order.payload) as OrderSnapshot;
}
