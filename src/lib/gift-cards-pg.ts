import { randomBytes } from "node:crypto";
import type { Queryable } from "./orders-pg";
import { getPool } from "./orders-pg";
import { giftExpiry, newGiftCode, type GiftCardRecord, type PendingGiftCard } from "./gift-card-types";

/**
 * Postgres gift card store. Shares the orders pool and the same `Queryable`
 * seam, so the SQL that runs on Neon is exercised by scripts/verify-pg.mjs.
 *
 * Every step that moves money is one conditional UPDATE, so two requests
 * racing can never both win: a card is issued once, and a balance is spent
 * only while it is there to spend.
 */

let seam: Queryable | null = null;
let ready: Promise<void> | null = null;

/** Test seam: point the store at Postgres-in-WASM. */
export function __setQueryable(q: Queryable | null) {
  seam = q;
  ready = null;
}

const db = async (): Promise<Queryable> => seam ?? (await getPool());

export function migrate(q?: Queryable): Promise<void> {
  ready ??= (async () => {
    const c = q ?? (await db());
    await c.query(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id           BIGSERIAL PRIMARY KEY,
        order_number TEXT NOT NULL,
        token        TEXT NOT NULL,
        amount       BIGINT NOT NULL,
        balance      BIGINT NOT NULL DEFAULT 0,
        code         TEXT UNIQUE,
        delivery     TEXT NOT NULL DEFAULT 'self',
        to_name      TEXT,
        from_name    TEXT,
        to_email     TEXT,
        note         TEXT,
        created_at   TEXT NOT NULL,
        issued_at    TEXT,
        expires_at   TEXT,
        emailed_at   TEXT,
        emails_sent  INTEGER NOT NULL DEFAULT 0
      )`);
    await c.query("CREATE INDEX IF NOT EXISTS idx_gift_cards_order ON gift_cards(order_number)");
    await c.query("CREATE INDEX IF NOT EXISTS idx_gift_cards_token ON gift_cards(token)");
    // every time a card pays towards an order, for the shop's own books
    await c.query(`
      CREATE TABLE IF NOT EXISTS gift_card_uses (
        id           BIGSERIAL PRIMARY KEY,
        code         TEXT NOT NULL,
        order_number TEXT NOT NULL,
        amount       BIGINT NOT NULL,
        created_at   TEXT NOT NULL
      )`);
  })().catch((err) => {
    ready = null; // a sleeping database must not stick for the life of the instance
    throw err;
  });
  return ready;
}

/** BIGINT comes back from pg as a string; the rest of the app does sums with these. */
const row = (r: Record<string, unknown>): GiftCardRecord => ({
  ...(r as unknown as GiftCardRecord),
  id: Number(r.id),
  amount: Number(r.amount),
  balance: Number(r.balance),
  emails_sent: Number(r.emails_sent),
});

export async function createPending(orderNumber: string, token: string, cards: PendingGiftCard[]): Promise<void> {
  const c = await db();
  await migrate(c);
  const now = new Date().toISOString();
  for (const card of cards) {
    await c.query(
      `INSERT INTO gift_cards (order_number, token, amount, delivery, to_name, from_name, to_email, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [orderNumber, token, card.amount, card.delivery, card.toName ?? null, card.fromName ?? null, card.toEmail ?? null, card.note ?? null, now],
    );
  }
}

async function where(column: "token" | "order_number" | "code", value: string): Promise<GiftCardRecord[]> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query(`SELECT * FROM gift_cards WHERE ${column} = $1 ORDER BY id`, [value]);
  return rows.map(row);
}

export const byToken = (token: string) => where("token", token);
export const byOrder = (orderNumber: string) => where("order_number", orderNumber);
export const byCode = async (code: string) => (await where("code", code))[0];

/**
 * Payment received: give every card under this token its code and its balance.
 * `code IS NULL` is the claim, so pressing the button twice makes one code.
 */
export async function issue(token: string): Promise<GiftCardRecord[]> {
  const c = await db();
  await migrate(c);
  const now = new Date();
  for (const card of await byToken(token)) {
    if (card.code) continue;
    await c.query(
      `UPDATE gift_cards SET code = $1, balance = amount, issued_at = $2, expires_at = $3
        WHERE id = $4 AND code IS NULL`,
      [newGiftCode(randomBytes(8)), now.toISOString(), giftExpiry(now).toISOString(), card.id],
    );
  }
  return byToken(token);
}

/** Take `amount` off a card, only if it is all there and the card is still good. */
export async function redeem(code: string, amount: number): Promise<boolean> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query(
    `UPDATE gift_cards SET balance = balance - $2
      WHERE code = $1 AND $2 > 0 AND balance >= $2 AND expires_at > $3 RETURNING id`,
    [code, amount, new Date().toISOString()],
  );
  return rows.length > 0;
}

/** Put it back: the order this was spent on could not be saved. */
export async function refund(code: string, amount: number): Promise<void> {
  const c = await db();
  await migrate(c);
  await c.query("UPDATE gift_cards SET balance = balance + $2 WHERE code = $1", [code, amount]);
}

export async function recordUse(code: string, orderNumber: string, amount: number): Promise<void> {
  const c = await db();
  await migrate(c);
  await c.query(
    "INSERT INTO gift_card_uses (code, order_number, amount, created_at) VALUES ($1, $2, $3, $4)",
    [code, orderNumber, amount, new Date().toISOString()],
  );
}

/** Claim the right to email this card, while it has sends left. */
export async function claimEmail(id: number, max: number): Promise<boolean> {
  const c = await db();
  await migrate(c);
  const { rows } = await c.query(
    `UPDATE gift_cards SET emails_sent = emails_sent + 1, emailed_at = $3
      WHERE id = $1 AND code IS NOT NULL AND emails_sent < $2 RETURNING id`,
    [id, max, new Date().toISOString()],
  );
  return rows.length > 0;
}

/** Hand a claim back when the send failed. */
export async function releaseEmail(id: number): Promise<void> {
  const c = await db();
  await migrate(c);
  await c.query(
    `UPDATE gift_cards SET emails_sent = GREATEST(emails_sent - 1, 0),
            emailed_at = CASE WHEN emails_sent <= 1 THEN NULL ELSE emailed_at END
      WHERE id = $1`,
    [id],
  );
}
