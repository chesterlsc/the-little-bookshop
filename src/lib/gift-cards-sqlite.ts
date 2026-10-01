/** SQLite gift card store: local development and the smoke tests. See gift-cards-pg. */
import { randomBytes } from "node:crypto";
import { getDb } from "./db";
import { giftExpiry, newGiftCode, type GiftCardRecord, type PendingGiftCard } from "./gift-card-types";

export function createPending(orderNumber: string, token: string, cards: PendingGiftCard[]): void {
  const insert = getDb().prepare(
    `INSERT INTO gift_cards (order_number, token, amount, delivery, to_name, from_name, to_email, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const now = new Date().toISOString();
  for (const card of cards) {
    insert.run(orderNumber, token, card.amount, card.delivery, card.toName ?? null, card.fromName ?? null, card.toEmail ?? null, card.note ?? null, now);
  }
}

const where = (column: "token" | "order_number" | "code", value: string) =>
  getDb().prepare(`SELECT * FROM gift_cards WHERE ${column} = ? ORDER BY id`).all(value) as GiftCardRecord[];

export const byToken = (token: string) => where("token", token);
export const byOrder = (orderNumber: string) => where("order_number", orderNumber);
export const byCode = (code: string): GiftCardRecord | undefined => where("code", code)[0];

export function issue(token: string): GiftCardRecord[] {
  const now = new Date();
  const update = getDb().prepare(
    "UPDATE gift_cards SET code = ?, balance = amount, issued_at = ?, expires_at = ? WHERE id = ? AND code IS NULL",
  );
  for (const card of byToken(token)) {
    if (!card.code) update.run(newGiftCode(randomBytes(8)), now.toISOString(), giftExpiry(now).toISOString(), card.id);
  }
  return byToken(token);
}

export function redeem(code: string, amount: number): boolean {
  const res = getDb()
    .prepare("UPDATE gift_cards SET balance = balance - ? WHERE code = ? AND ? > 0 AND balance >= ? AND expires_at > ?")
    .run(amount, code, amount, amount, new Date().toISOString());
  return res.changes > 0;
}

export function refund(code: string, amount: number): void {
  getDb().prepare("UPDATE gift_cards SET balance = balance + ? WHERE code = ?").run(amount, code);
}

export function recordUse(code: string, orderNumber: string, amount: number): void {
  getDb()
    .prepare("INSERT INTO gift_card_uses (code, order_number, amount, created_at) VALUES (?, ?, ?, ?)")
    .run(code, orderNumber, amount, new Date().toISOString());
}

export function claimEmail(id: number, max: number): boolean {
  const res = getDb()
    .prepare("UPDATE gift_cards SET emails_sent = emails_sent + 1, emailed_at = ? WHERE id = ? AND code IS NOT NULL AND emails_sent < ?")
    .run(new Date().toISOString(), id, max);
  return res.changes > 0;
}

export function releaseEmail(id: number): void {
  getDb()
    .prepare(
      "UPDATE gift_cards SET emailed_at = CASE WHEN emails_sent <= 1 THEN NULL ELSE emailed_at END, emails_sent = MAX(emails_sent - 1, 0) WHERE id = ?",
    )
    .run(id);
}
