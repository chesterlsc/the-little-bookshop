import { randomBytes } from "node:crypto";
import type { OrderSnapshot } from "./checkout";
import type { OrderRecord, OrderStatus } from "./orders-types";
import { orderSuffix } from "./orders-types";

/**
 * Postgres order store, used whenever DATABASE_URL is set (i.e. in production).
 *
 * Serverless hosts give every request a fresh, read-only filesystem, so the
 * SQLite store cannot persist there: orders save and are instantly unreachable,
 * and the numbering restarts on every instance. This works against Neon,
 * Supabase or any Postgres — use a POOLED connection string on serverless.
 *
 * Everything goes through the tiny `Queryable` seam below rather than importing
 * a driver directly, so the same SQL runs against Postgres-in-WASM in the
 * verification script (scripts/verify-pg.mjs).
 */
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

let pool: Queryable | null = null;

/** Shared by the subscribers store, so both use one connection pool. */
export async function getPool(): Promise<Queryable> {
  return db();
}

/** Lazily opened, so importing this module never dials out on its own. */
async function db(): Promise<Queryable> {
  if (pool) return pool;
  const { Pool } = await import("pg");
  const url = process.env.DATABASE_URL ?? "";
  const local = url.includes("localhost") || url.includes("127.0.0.1");
  pool = new Pool({
    // The query string's own sslmode is dropped: pg reads `require` as
    // `verify-full` today and will read it as libpq's weaker meaning in a
    // future major, so the mode is stated here instead of inherited.
    connectionString: url.split("?")[0],
    // Hosted Postgres presents a publicly trusted certificate, so the chain is
    // verified. Accepting any certificate would let anything between here and
    // the database read every order.
    ssl: local ? undefined : true,
    max: 3,
  }) as unknown as Queryable;
  return pool;
}

/** Test seam: point the store at Postgres-in-WASM. */
export function __setQueryable(q: Queryable | null) {
  pool = q;
  ready = null;
}

let ready: Promise<void> | null = null;

/** Creates the table and the number sequence once per instance. */
export function migrate(q?: Queryable): Promise<void> {
  ready ??= (async () => {
    const c = q ?? (await db());
    await c.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id              BIGSERIAL PRIMARY KEY,
        number          TEXT UNIQUE NOT NULL,
        status          TEXT NOT NULL DEFAULT 'awaiting_payment',
        provider        TEXT NOT NULL DEFAULT 'manual',
        provider_ref    TEXT,
        provider_status TEXT,
        payload         TEXT NOT NULL,
        subtotal        BIGINT NOT NULL,
        shipping        BIGINT NOT NULL,
        total           BIGINT NOT NULL,
        currency        TEXT NOT NULL DEFAULT 'PHP',
        emails_sent     INTEGER NOT NULL DEFAULT 0,
        created_at      TEXT NOT NULL,
        paid_at         TEXT
      )`);
    // The human half of the order number. A sequence, not the row id, so it is
    // allocated atomically inside the INSERT and can never repeat or restart.
    await c.query(`CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001`);
    // Where the parcel is, for the customer's own tracking page. Added
    // separately so a database created before this still gains them.
    for (const col of ["courier TEXT", "tracking_number TEXT", "tracking_url TEXT", "shipped_at TEXT"]) {
      await c.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${col}`);
    }
  })();
  return ready;
}

/** BIGINT comes back as a string from pg; money must not become one. */
function toRecord(row: Record<string, unknown>): OrderRecord {
  return {
    ...row,
    id: Number(row.id),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    emails_sent: Number(row.emails_sent),
  } as OrderRecord;
}

export async function createOrder(
  snapshot: OrderSnapshot,
  provider = "manual",
): Promise<OrderRecord> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query(
    `INSERT INTO orders (number, status, provider, payload, subtotal, shipping, total, currency, created_at)
     VALUES ('LB' || nextval('order_number_seq') || '-' || $1,
             'awaiting_payment', $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      orderSuffix(randomBytes(6)),
      provider,
      JSON.stringify(snapshot),
      snapshot.subtotal,
      snapshot.shipping,
      snapshot.total,
      snapshot.currency,
      new Date().toISOString(),
    ],
  );
  return toRecord(rows[0]);
}

export async function getOrder(number: string): Promise<OrderRecord | undefined> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query("SELECT * FROM orders WHERE number = $1", [number]);
  return rows[0] ? toRecord(rows[0]) : undefined;
}

/** The order book, newest first. For the shop's own eyes only. */
export async function listOrders(limit = 100): Promise<OrderRecord[]> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query(
    "SELECT * FROM orders ORDER BY id DESC LIMIT $1",
    [Math.min(Math.max(1, limit), 1000)],
  );
  return rows.map(toRecord);
}

export async function setPaymentMethod(number: string, method: string): Promise<void> {
  const c = await db();
  await migrate(c);
  await c.query(
    "UPDATE orders SET provider_ref = $1 WHERE number = $2 AND status = 'awaiting_payment'",
    [method, number],
  );
}

export async function markStatus(
  number: string,
  status: OrderStatus,
  note?: string,
): Promise<void> {
  const c = await db();
  await migrate(c);
  await c.query(
    `UPDATE orders
        SET status = $1,
            provider_status = COALESCE($2, provider_status),
            paid_at = CASE WHEN $1 = 'confirmed' AND paid_at IS NULL THEN $3 ELSE paid_at END
      WHERE number = $4`,
    [status, note ?? null, new Date().toISOString(), number],
  );
}

/**
 * The shop hands the parcel over. Moves the order to `shipped`, stamps the
 * date, and records whatever the courier gave us so the tracking page can
 * show it. Called by the shop, never by the storefront.
 */
export async function markShipped(
  number: string,
  courier: string,
  trackingNumber: string,
  trackingUrl?: string,
): Promise<void> {
  const c = await db();
  await migrate(c);
  await c.query(
    `UPDATE orders
        SET status = 'shipped',
            courier = $1,
            tracking_number = $2,
            tracking_url = $3,
            shipped_at = COALESCE(shipped_at, $4)
      WHERE number = $5`,
    [courier, trackingNumber, trackingUrl ?? null, new Date().toISOString(), number],
  );
}

export async function claimEmailSend(number: string): Promise<boolean> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query(
    "UPDATE orders SET emails_sent = 1 WHERE number = $1 AND emails_sent = 0 RETURNING id",
    [number],
  );
  return rows.length > 0;
}

export async function releaseEmailSend(number: string): Promise<void> {
  const c = await db();
  await migrate(c);
  await c.query("UPDATE orders SET emails_sent = 0 WHERE number = $1", [number]);
}
