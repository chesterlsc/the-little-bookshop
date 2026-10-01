import type { Cents } from "./money";

/**
 * Gift cards: the shapes and the small pure rules both stores share.
 *
 * A card is a row from the moment it is ordered, but it has no code and no
 * balance until the shop confirms the buyer's payment. That is the whole
 * safeguard: an unpaid card has nothing on it to spend, and nothing to guess.
 */

/** "self": the buyer gets the card. "friend": it is emailed to someone else. */
export type GiftDelivery = "self" | "friend";

/** What the buyer chooses on the gift card page, carried on the basket line. */
export interface GiftDetails {
  delivery: GiftDelivery;
  toName?: string;
  fromName?: string;
  toEmail?: string;
  note?: string;
}

/** The same shape the checkout asks of the buyer's own address. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const GIFT_NOTE_MAX = 200;
export const GIFT_NAME_MAX = 40;

export interface GiftCardRecord {
  id: number;
  /** the order this card was bought in */
  order_number: string;
  /** the private key of the shop's "payment received" page, one per order */
  token: string;
  amount: number;
  /** zero until issued, then what is left to spend */
  balance: number;
  /** null until the shop confirms payment */
  code: string | null;
  delivery: GiftDelivery;
  to_name: string | null;
  from_name: string | null;
  to_email: string | null;
  note: string | null;
  created_at: string;
  issued_at: string | null;
  expires_at: string | null;
  emailed_at: string | null;
  /** how many times its emails have gone out, resends included */
  emails_sent: number;
}

/** A card ordered but not yet paid for: everything but the code. */
export interface PendingGiftCard extends GiftDetails {
  amount: Cents;
}

/** Good for this long from the day the payment is confirmed. */
export const GIFT_CARD_MONTHS = 12;

/** The first send, and three more: "send the email again" is not a mail tap. */
export const MAX_GIFT_EMAILS = 4;

/**
 * No 0/O, 1/I/L: these are read off a picture and typed by hand. Eight of
 * these after the prefix is 31^8, about 850 billion codes, behind a throttle.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const PREFIX = "LBGC";

export function newGiftCode(bytes: Uint8Array): string {
  const c = Array.from(bytes.slice(0, 8), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${PREFIX}-${c.slice(0, 4)}-${c.slice(4)}`;
}

/**
 * Typed by hand, so spaces, dashes and case are forgiven. Anything that is not
 * shaped like one of our codes comes back empty and never reaches the database.
 */
export function normalizeGiftCode(raw: string | undefined | null): string {
  const s = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!new RegExp(`^${PREFIX}[${ALPHABET}]{8}$`).test(s)) return "";
  return `${PREFIX}-${s.slice(4, 8)}-${s.slice(8)}`;
}

/** "••M9TA": enough to recognise a card, not enough to spend it. */
export const maskGiftCode = (code: string) => `••${code.slice(-4)}`;

export function giftExpiry(issuedAt: Date): Date {
  const d = new Date(issuedAt);
  d.setMonth(d.getMonth() + GIFT_CARD_MONTHS);
  return d;
}

/** "1 Oct 2027", in the shop's own timezone. */
export const giftDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Manila", day: "numeric", month: "short", year: "numeric" });

export type GiftCardState =
  | { status: "ok"; balance: Cents; expiresAt: string; last4: string }
  | { status: "unknown" }
  | { status: "expired"; expiredOn: string }
  | { status: "empty" };

/** What a code is worth right now. The one rule the check and the checkout share. */
export function giftCardState(card: GiftCardRecord | undefined, now = new Date()): GiftCardState {
  if (!card?.code || !card.expires_at) return { status: "unknown" };
  if (new Date(card.expires_at) <= now) return { status: "expired", expiredOn: card.expires_at };
  if (card.balance <= 0) return { status: "empty" };
  return { status: "ok", balance: card.balance, expiresAt: card.expires_at, last4: card.code.slice(-4) };
}

/** Why a code cannot be used, in the shop's own words. Shown at checkout as-is. */
export function giftCardProblem(state: GiftCardState): string {
  switch (state.status) {
    case "unknown":
      return "That code isn't one of ours. Check the letters and try again.";
    case "expired":
      return `This card ran out on ${giftDate(state.expiredOn)}. Cards last 12 months from the day they were bought.`;
    case "empty":
      return "This card is all used up. There's nothing left on it.";
    default:
      return "";
  }
}

export const GIFT_ON_GIFT = "A gift card can't pay for another gift card. Check out the gift card on its own.";

/** Common slips of the thumb in an email's domain, and what was meant. */
const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gnail.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "iclod.com": "icloud.com",
};

/** "ana@gmial.com" → "ana@gmail.com"; undefined when nothing looks wrong. */
export function suggestEmail(email: string): string | undefined {
  const [name, domain] = email.trim().toLowerCase().split("@");
  const fixed = domain && DOMAIN_TYPOS[domain];
  return name && fixed ? `${name}@${fixed}` : undefined;
}
