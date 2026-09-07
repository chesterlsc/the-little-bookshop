import type { Queryable } from "./orders-pg";
import { getPool } from "./orders-pg";

/**
 * The mailing list: everyone who took the welcome offer.
 *
 * Shares the orders pool and the same `Queryable` seam, so the SQL that will
 * run on Neon is exercised by scripts/verify-pg.mjs without a live database.
 *
 * The signup emails remain the backstop: a write that fails here is logged and
 * swallowed by the route, because losing a row is survivable when the shop
 * still has the notice in its inbox.
 */

export interface SubscriberRecord {
  id: number;
  email: string;
  /** instagram | facebook | tiktok | friend | other */
  source: string;
  code: string;
  created_at: string;
  /** set when they ask to be removed; kept so the address is not re-added */
  unsubscribed_at: string | null;
}

let seam: Queryable | null = null;
let ready: Promise<void> | null = null;

/** Test seam: point the list at Postgres-in-WASM. */
export function __setQueryable(q: Queryable | null) {
  seam = q;
  ready = null;
}

const db = async (): Promise<Queryable> => seam ?? (await getPool());

export function migrate(q?: Queryable): Promise<void> {
  ready ??= (async () => {
    const c = q ?? (await db());
    await c.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id              BIGSERIAL PRIMARY KEY,
        email           TEXT UNIQUE NOT NULL,
        source          TEXT NOT NULL,
        code            TEXT NOT NULL,
        created_at      TEXT NOT NULL,
        unsubscribed_at TEXT
      )`);
  })();
  return ready;
}

function toRecord(row: Record<string, unknown>): SubscriberRecord {
  return { ...row, id: Number(row.id) } as SubscriberRecord;
}

/**
 * Records a signup. Signing up twice keeps the original date and refreshes the
 * source, and un-removes anyone who had previously asked to be taken off,
 * because asking again is a clearer signal than the old opt-out.
 */
export async function addSubscriber(
  email: string,
  source: string,
  code: string,
): Promise<SubscriberRecord> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query(
    `INSERT INTO subscribers (email, source, code, created_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE
       SET source = EXCLUDED.source, unsubscribed_at = NULL
     RETURNING *`,
    [email, source, code, new Date().toISOString()],
  );
  return toRecord(rows[0]);
}

/** The list, newest first. Everything the shop needs to mail its readers. */
export async function listSubscribers(limit = 500): Promise<SubscriberRecord[]> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query(
    // by id, not created_at: signups in the same millisecond would otherwise
    // come back in an arbitrary order, and id is always insertion order
    `SELECT * FROM subscribers WHERE unsubscribed_at IS NULL
      ORDER BY id DESC LIMIT $1`,
    [Math.min(Math.max(1, limit), 5000)],
  );
  return rows.map(toRecord);
}

/** Honours a reply asking to be removed, without losing the row. */
export async function removeSubscriber(email: string): Promise<void> {
  const c = await db();
  await migrate(c);
  await c.query("UPDATE subscribers SET unsubscribed_at = $1 WHERE email = $2", [
    new Date().toISOString(),
    email.trim().toLowerCase(),
  ]);
}

export async function countSubscribers(): Promise<number> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query(
    "SELECT COUNT(*)::int AS n FROM subscribers WHERE unsubscribed_at IS NULL",
  );
  return Number(rows[0]?.n ?? 0);
}
