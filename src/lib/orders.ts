import { randomBytes } from "node:crypto";
import { getDb } from "./db";
import type { OrderSnapshot } from "./checkout";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export interface OrderRecord {
  id: number;
  number: string;
  status: OrderStatus;
  provider: string;
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

/** Unambiguous alphabet (no 0/O, 1/I/L); order numbers get read over the phone. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomNumber(): string {
  const bytes = randomBytes(10);
  let s = "";
  for (let i = 0; i < 10; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `LB-${s.slice(0, 5)}-${s.slice(5)}`;
}

export function createOrder(snapshot: OrderSnapshot, provider: string): OrderRecord {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO orders (number, status, provider, payload, subtotal, shipping, total, currency, created_at)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = randomNumber();
    try {
      insert.run(
        number,
        provider,
        JSON.stringify(snapshot),
        snapshot.subtotal,
        snapshot.shipping,
        snapshot.total,
        snapshot.currency,
        new Date().toISOString(),
      );
      return getOrder(number)!;
    } catch (err) {
      const uniqueClash = err instanceof Error && /UNIQUE/.test(err.message);
      if (!uniqueClash || attempt === 4) throw err;
    }
  }
  throw new Error("could not allocate an order number");
}

export function getOrder(number: string): OrderRecord | undefined {
  return getDb()
    .prepare("SELECT * FROM orders WHERE number = ?")
    .get(number) as OrderRecord | undefined;
}

export function setProviderRef(number: string, ref: string): void {
  getDb().prepare("UPDATE orders SET provider_ref = ? WHERE number = ?").run(ref, number);
}

export function setProviderStatus(number: string, status: string): void {
  getDb().prepare("UPDATE orders SET provider_status = ? WHERE number = ?").run(status, number);
}

/** Marks paid exactly once; returns true only for the transition. */
export function markPaid(number: string, providerStatus: string): boolean {
  const res = getDb()
    .prepare(
      "UPDATE orders SET status = 'paid', provider_status = ?, paid_at = ? WHERE number = ? AND status != 'paid'",
    )
    .run(providerStatus, new Date().toISOString(), number);
  return res.changes > 0;
}

export function markStatus(number: string, status: OrderStatus, providerStatus?: string): void {
  if (status === "paid") throw new Error("use markPaid for the paid transition");
  getDb()
    .prepare("UPDATE orders SET status = ?, provider_status = COALESCE(?, provider_status) WHERE number = ? AND status != 'paid'")
    .run(status, providerStatus ?? null, number);
}

/** Claim the right to send order emails exactly once. */
export function claimEmailSend(number: string): boolean {
  const res = getDb()
    .prepare("UPDATE orders SET emails_sent = 1 WHERE number = ? AND emails_sent = 0")
    .run(number);
  return res.changes > 0;
}

export function parseSnapshot(order: OrderRecord): OrderSnapshot {
  return JSON.parse(order.payload) as OrderSnapshot;
}
