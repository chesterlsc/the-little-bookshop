/** SQLite mailing list: local development, and the smoke tests. */
import { getDb } from "./db";
import type { SubscriberRecord } from "./subscribers-pg";

/**
 * The same list as subscribers-pg, against the development database, so a
 * laptop with no DATABASE_URL still records signups and `npm run shop` has
 * something to show. Production uses Postgres; the shapes match on purpose.
 */

export function addSubscriber(email: string, source: string, code: string): SubscriberRecord {
  const db = getDb();
  db.prepare(
    `INSERT INTO subscribers (email, source, code, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE
       SET source = excluded.source, unsubscribed_at = NULL`,
  ).run(email, source, code, new Date().toISOString());
  return db.prepare("SELECT * FROM subscribers WHERE email = ?").get(email) as SubscriberRecord;
}

export function listSubscribers(limit = 500): SubscriberRecord[] {
  return getDb()
    .prepare(
      "SELECT * FROM subscribers WHERE unsubscribed_at IS NULL ORDER BY id DESC LIMIT ?",
    )
    .all(Math.min(Math.max(1, limit), 5000)) as SubscriberRecord[];
}

export function removeSubscriber(email: string): void {
  getDb()
    .prepare("UPDATE subscribers SET unsubscribed_at = ? WHERE email = ?")
    .run(new Date().toISOString(), email.trim().toLowerCase());
}

/** See subscribers-pg. One process holds this file, so a transaction is the whole claim. */
export function claimDigest(min: number): SubscriberRecord[] {
  const db = getDb();
  return db.transaction(() => {
    const rows = db
      .prepare("SELECT * FROM subscribers WHERE notified_at IS NULL AND unsubscribed_at IS NULL ORDER BY id")
      .all() as SubscriberRecord[];
    if (rows.length < min) return [];
    const mark = db.prepare("UPDATE subscribers SET notified_at = ? WHERE id = ?");
    const stamp = new Date().toISOString();
    for (const r of rows) mark.run(stamp, r.id);
    return rows;
  })();
}

export function releaseDigest(ids: number[]): void {
  const db = getDb();
  const clear = db.prepare("UPDATE subscribers SET notified_at = NULL WHERE id = ?");
  db.transaction(() => ids.forEach((id) => clear.run(id)))();
}

export function countSubscribers(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM subscribers WHERE unsubscribed_at IS NULL")
    .get() as { n: number };
  return Number(row?.n ?? 0);
}
