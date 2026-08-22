import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * A small SQLite store for orders: no ORM, no admin platform, just a table.
 * The path is configurable so deployments can point at a persistent volume.
 */

const DB_PATH = process.env.ORDERS_DB_PATH ?? "var/data/orders.sqlite";

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
      status TEXT NOT NULL DEFAULT 'pending',        -- pending | paid | failed | cancelled
      provider TEXT NOT NULL,
      provider_ref TEXT,
      provider_status TEXT,                          -- raw status from the provider (safe reference only)
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
  return db;
}
