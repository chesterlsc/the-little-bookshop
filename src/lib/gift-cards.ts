import type { GiftCardRecord, PendingGiftCard } from "./gift-card-types";
import * as sqlite from "./gift-cards-sqlite";

export type { GiftCardRecord } from "./gift-card-types";

/**
 * The gift card store, one async surface over two backends, exactly as the
 * order store works: Postgres whenever DATABASE_URL is set, SQLite otherwise.
 */
const usePg = Boolean(process.env.DATABASE_URL);

type PgModule = typeof import("./gift-cards-pg");
let pgPromise: Promise<PgModule> | null = null;
/** Loaded lazily so the driver never initializes without a DATABASE_URL. */
const pg = (): Promise<PgModule> => (pgPromise ??= import("./gift-cards-pg"));

/** The cards in an order, saved the moment it is placed: no code, nothing to spend. */
export async function createPendingGiftCards(orderNumber: string, token: string, cards: PendingGiftCard[]): Promise<void> {
  return usePg ? (await pg()).createPending(orderNumber, token, cards) : sqlite.createPending(orderNumber, token, cards);
}

export async function giftCardsByToken(token: string): Promise<GiftCardRecord[]> {
  return usePg ? (await pg()).byToken(token) : sqlite.byToken(token);
}

export async function giftCardsByOrder(orderNumber: string): Promise<GiftCardRecord[]> {
  return usePg ? (await pg()).byOrder(orderNumber) : sqlite.byOrder(orderNumber);
}

export async function giftCardByCode(code: string): Promise<GiftCardRecord | undefined> {
  return usePg ? (await pg()).byCode(code) : sqlite.byCode(code);
}

/** Payment received: make the codes. Safe to call twice; the second call changes nothing. */
export async function issueGiftCards(token: string): Promise<GiftCardRecord[]> {
  return usePg ? (await pg()).issue(token) : sqlite.issue(token);
}

/** Spend from a card. False when it is not all there, or the card has run out. */
export async function redeemGiftCard(code: string, amount: number): Promise<boolean> {
  return usePg ? (await pg()).redeem(code, amount) : sqlite.redeem(code, amount);
}

export async function refundGiftCard(code: string, amount: number): Promise<void> {
  return usePg ? (await pg()).refund(code, amount) : sqlite.refund(code, amount);
}

export async function recordGiftCardUse(code: string, orderNumber: string, amount: number): Promise<void> {
  return usePg ? (await pg()).recordUse(code, orderNumber, amount) : sqlite.recordUse(code, orderNumber, amount);
}

export async function claimGiftEmail(id: number, max: number): Promise<boolean> {
  return usePg ? (await pg()).claimEmail(id, max) : sqlite.claimEmail(id, max);
}

export async function releaseGiftEmail(id: number): Promise<void> {
  return usePg ? (await pg()).releaseEmail(id) : sqlite.releaseEmail(id);
}
