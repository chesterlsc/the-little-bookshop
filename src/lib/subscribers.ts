import type { SubscriberRecord } from "./subscribers-pg";

export type { SubscriberRecord } from "./subscribers-pg";

/**
 * The mailing list, with one async surface over the one backend it has.
 *
 * Postgres whenever DATABASE_URL is set, which is how production runs. With no
 * DATABASE_URL there is nowhere durable to write: serverless hosts give every
 * request a fresh, read-only filesystem, so a local file would be a list that
 * vanishes. Rather than pretend, every call becomes a no-op and `enabled` says
 * so plainly. The signup emails still go out either way, so the shop keeps its
 * record in the inbox exactly as it did before this table existed.
 */
export const enabled = Boolean(process.env.DATABASE_URL);

type PgModule = typeof import("./subscribers-pg");
let pgPromise: Promise<PgModule> | null = null;
/** Loaded lazily so the driver never initializes without a DATABASE_URL. */
const pg = (): Promise<PgModule> => (pgPromise ??= import("./subscribers-pg"));

export async function addSubscriber(
  email: string,
  source: string,
  code: string,
): Promise<SubscriberRecord | null> {
  if (!enabled) return null;
  return (await pg()).addSubscriber(email, source, code);
}

export async function listSubscribers(limit?: number): Promise<SubscriberRecord[]> {
  if (!enabled) return [];
  return (await pg()).listSubscribers(limit);
}

export async function removeSubscriber(email: string): Promise<void> {
  if (!enabled) return;
  return (await pg()).removeSubscriber(email);
}

export async function countSubscribers(): Promise<number> {
  if (!enabled) return 0;
  return (await pg()).countSubscribers();
}
