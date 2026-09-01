import type { OrderSnapshot } from "./checkout";
import type { OrderRecord, OrderStatus } from "./orders-types";
import * as sqlite from "./orders-sqlite";

export type { OrderRecord, OrderStatus } from "./orders-types";
export { ORDER_STATUS_FLOW } from "./orders-types";

/**
 * The order store, with one async surface over two backends.
 *
 * Postgres (Neon) whenever DATABASE_URL is set, which is how production runs:
 * serverless hosts give every request a fresh, read-only filesystem, so a
 * file-backed store there saves orders that are instantly unreachable and
 * restarts its numbering on every instance.
 *
 * SQLite otherwise, so local development and `npm run smoke` stay zero-config.
 *
 * Everything is async because Postgres is; the SQLite calls are synchronous
 * underneath and simply resolve immediately.
 */
const usePg = Boolean(process.env.DATABASE_URL);

/** Loaded lazily so the Neon driver never initializes without a DATABASE_URL. */
type PgModule = typeof import("./orders-pg");
let pgPromise: Promise<PgModule> | null = null;
const pg = (): Promise<PgModule> => (pgPromise ??= import("./orders-pg"));

export async function createOrder(
  snapshot: OrderSnapshot,
  provider = "manual",
): Promise<OrderRecord> {
  return usePg
    ? (await pg()).createOrder(snapshot, provider)
    : sqlite.createOrder(snapshot, provider);
}

export async function getOrder(number: string): Promise<OrderRecord | undefined> {
  return usePg ? (await pg()).getOrder(number) : sqlite.getOrder(number);
}

/** Records which method the customer said they used. Never a confirmation. */
export async function setPaymentMethod(number: string, method: string): Promise<void> {
  return usePg ? (await pg()).setPaymentMethod(number, method) : sqlite.setPaymentMethod(number, method);
}

/**
 * Moves an order along the manual flow. Used by the shop, not the customer:
 * nothing on the storefront may set anything past `payment_submitted`.
 */
export async function markStatus(
  number: string,
  status: OrderStatus,
  note?: string,
): Promise<void> {
  return usePg ? (await pg()).markStatus(number, status, note) : sqlite.markStatus(number, status, note);
}

/** Claim the right to send the order emails exactly once. */
export async function claimEmailSend(number: string): Promise<boolean> {
  return usePg ? (await pg()).claimEmailSend(number) : sqlite.claimEmailSend(number);
}

/** Hand a claim back when the send failed, so a later visit retries. */
export async function releaseEmailSend(number: string): Promise<void> {
  return usePg ? (await pg()).releaseEmailSend(number) : sqlite.releaseEmailSend(number);
}

export function parseSnapshot(order: OrderRecord): OrderSnapshot {
  return JSON.parse(order.payload) as OrderSnapshot;
}
