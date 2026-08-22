import { setProviderStatus } from "../orders";
import { baseUrl, type PaymentProvider } from "./types";

/**
 * Development provider: a clearly-labeled local simulator.
 * It never pretends to be a real payment: the simulated page says DEV MODE,
 * and verification only reports what the simulator was explicitly told.
 */
export const devProvider: PaymentProvider = {
  id: "dev",
  label: "Simulated payment (development mode)",

  async createCheckoutSession(order) {
    const ref = `dev_${order.number}`;
    return {
      redirectUrl: `${baseUrl()}/dev/pay/${encodeURIComponent(order.number)}`,
      providerRef: ref,
    };
  },

  async verifyPayment(order) {
    // provider_status is set only by the simulator's explicit buttons
    switch (order.provider_status) {
      case "dev_paid":
        return { state: "paid", reference: order.provider_ref ?? "dev" };
      case "dev_failed":
        return { state: "failed", reference: order.provider_ref ?? "dev" };
      case "dev_cancelled":
        return { state: "cancelled", reference: order.provider_ref ?? "dev" };
      default:
        return { state: "pending", reference: order.provider_ref ?? "dev" };
    }
  },

  async parseWebhook(rawBody) {
    // the simulator posts { orderNumber, outcome }; no signature in dev mode
    try {
      const body = JSON.parse(rawBody) as { orderNumber?: string; outcome?: string };
      if (!body.orderNumber || !body.outcome) return null;
      const state =
        body.outcome === "paid" ? "paid" : body.outcome === "cancelled" ? "cancelled" : "failed";
      return {
        orderNumber: body.orderNumber,
        providerRef: `dev_${body.orderNumber}`,
        state,
        reference: `dev_${body.outcome}`,
      };
    } catch {
      return null;
    }
  },
};

/** Called by the simulator page's buttons (dev mode only). */
export function devSetOutcome(orderNumber: string, outcome: "paid" | "failed" | "cancelled"): void {
  setProviderStatus(orderNumber, `dev_${outcome}`);
}
