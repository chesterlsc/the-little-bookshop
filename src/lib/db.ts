import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * A small SQLite store for orders: no ORM, no admin platform, just a table.
 * The path is configurable so deployments can point at a persistent volume.
 */

/**
 * Where the order store lives.
 *
 * Serverless hosts (Vercel) give you a read-only filesystem apart from /tmp,
 * so the repo-relative default cannot be created there and every checkout
 * would fail. /tmp works, but only survives while that instance stays warm.
 *
 * ponytail: /tmp is a stop-gap so the shop can take orders TODAY. Both order
 * emails go out at placement and now carry the full payment details, so the
 * shop and the customer each hold everything the order needs even if the row
 * is lost. Point ORDERS_DB_PATH at a persistent volume, or move `orders.ts`
 * onto Postgres/Turso, before this handles real volume.
 */
const DB_PATH =
  process.env.ORDERS_DB_PATH ??
  (process.env.VERCEL ? "/tmp/little-bookshop/orders.sqlite" : "var/data/orders.sqlite");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const full = path.resolve(process.cwd(), DB_PATH);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  db = new Database(full);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'awaiting_payment',
      -- awaiting_payment | payment_submitted | confirmed | preparing | shipped | completed | cancelled
      provider TEXT NOT NULL,                        -- always 'manual': transfer + screenshot on Instagram
      provider_ref TEXT,                             -- payment method the customer picked, once known
      provider_status TEXT,                          -- free-text note the shop can set while verifying
      payload TEXT NOT NULL,                         -- JSON snapshot: items, customer, pricing
      subtotal INTEGER NOT NULL,
      shipping INTEGER NOT NULL,
      total INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      emails_sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      paid_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(number);
  `);
  // Older rows used the gateway statuses; bring them onto the manual set.
  db.exec(`
    UPDATE orders SET status = 'awaiting_payment' WHERE status = 'pending';
    UPDATE orders SET status = 'confirmed'        WHERE status = 'paid';
    UPDATE orders SET status = 'cancelled'        WHERE status = 'failed';
  `);
  return db;
}
