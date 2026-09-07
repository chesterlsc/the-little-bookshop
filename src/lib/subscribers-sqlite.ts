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

export function countSubscribers(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM subscribers WHERE unsubscribed_at IS NULL")
    .get() as { n: number };
  return Number(row?.n ?? 0);
}
