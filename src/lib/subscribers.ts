import type { SubscriberRecord } from "./subscribers-pg";
import * as sqlite from "./subscribers-sqlite";

export type { SubscriberRecord } from "./subscribers-pg";

/**
 * The mailing list, with one async surface over two backends, exactly as the
 * order store works.
 *
 * Postgres whenever DATABASE_URL is set, which is how production runs, because
 * serverless hosts give every request a fresh read-only filesystem. SQLite
 * otherwise, so a laptop records signups with no configuration at all.
 *
 * The signup emails remain the record either way: a write that fails here is
 * logged by the route rather than failing the customer.
 */
const usePg = Boolean(process.env.DATABASE_URL);

type PgModule = typeof import("./subscribers-pg");
let pgPromise: Promise<PgModule> | null = null;
/** Loaded lazily so the driver never initializes without a DATABASE_URL. */
const pg = (): Promise<PgModule> => (pgPromise ??= import("./subscribers-pg"));

export async function addSubscriber(
  email: string,
  source: string,
  code: string,
): Promise<SubscriberRecord> {
  return usePg
    ? (await pg()).addSubscriber(email, source, code)
    : sqlite.addSubscriber(email, source, code);
}

export async function listSubscribers(limit?: number): Promise<SubscriberRecord[]> {
  return usePg ? (await pg()).listSubscribers(limit) : sqlite.listSubscribers(limit);
}

export async function removeSubscriber(email: string): Promise<void> {
  return usePg ? (await pg()).removeSubscriber(email) : sqlite.removeSubscriber(email);
}

export async function countSubscribers(): Promise<number> {
  return usePg ? (await pg()).countSubscribers() : sqlite.countSubscribers();
}
