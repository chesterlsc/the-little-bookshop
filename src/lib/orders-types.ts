/**
 * Shared order shapes and the pieces both stores need.
 * Kept apart from the stores so neither driver pulls the other in.
 */

/**
 * Manual-payment order lifecycle. The customer transfers the total themselves
 * and sends a screenshot on Instagram; the shop moves the order forward by
 * hand, so nothing here is ever set automatically by a payment provider.
 */
export type OrderStatus =
  | "awaiting_payment"
  | "payment_submitted"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "completed"
  | "cancelled";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "awaiting_payment",
  "payment_submitted",
  "confirmed",
  "preparing",
  "shipped",
  "completed",
];

export interface OrderRecord {
  id: number;
  number: string;
  status: OrderStatus;
  provider: string;
  /** which method the customer said they used, once they tell us */
  provider_ref: string | null;
  provider_status: string | null;
  payload: string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  emails_sent: number;
  created_at: string;
  paid_at: string | null;
}

/** Human half of the order number: LB1024-… starts the sequence at 1001. */
export const NUMBER_OFFSET = 1000;

/**
 * The random half. Order pages have no login, so this suffix is the only thing
 * standing between a stranger and a customer's home address — without it the
 * sequential half alone lets anyone read every order by counting upward.
 * Unambiguous alphabet (no 0/O, 1/I/L): these get read out loud in DMs.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function orderSuffix(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
