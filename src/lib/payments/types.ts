import type { OrderRecord } from "../orders";

/**
 * Hosted-payment provider adapter. The site never touches card data:
 * every provider redirects the customer to its own secure payment page,
 * and the server verifies the result before an order is marked paid.
 */
export interface PaymentProvider {
  id: string;
  /** Human label shown on the checkout page ("Pay securely with …"). */
  label: string;
  /** Creates a hosted checkout and returns where to send the customer. */
  createCheckoutSession(order: OrderRecord): Promise<{ redirectUrl: string; providerRef: string }>;
  /**
   * Asks the provider for the real payment state of this order.
   * Used on return from the payment page AND by the webhook path:
   * a customer merely landing on the success URL never marks an order paid.
   */
  verifyPayment(order: OrderRecord): Promise<PaymentVerification>;
  /**
   * Parses + authenticates a webhook request. Returns the affected order
   * number and its verified state, or null when the event is irrelevant.
   * Throws when the signature is invalid.
   */
  parseWebhook(rawBody: string, headers: Headers): Promise<WebhookResult | null>;
}

export interface PaymentVerification {
  state: "paid" | "pending" | "failed" | "cancelled";
  /** Safe reference for emails/receipts (an id or status string, never credentials). */
  reference: string;
}

export interface WebhookResult {
  orderNumber: string | null;
  providerRef: string | null;
  state: PaymentVerification["state"];
  reference: string;
}

export function baseUrl(): string {
  return (process.env.PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
