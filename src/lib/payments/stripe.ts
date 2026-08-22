import { createHmac, timingSafeEqual } from "node:crypto";
import { parseSnapshot } from "../orders";
import { baseUrl, type PaymentProvider } from "./types";

/**
 * Stripe hosted Checkout (no SDK, plain REST).
 * Required env:
 *   STRIPE_SECRET_KEY      : sk_test_… / sk_live_…
 *   STRIPE_WEBHOOK_SECRET  : whsec_… (for /api/payments/webhook)
 */

const API = "https://api.stripe.com/v1";

function key(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error("STRIPE_SECRET_KEY is not set");
  return k;
}

function currency(): string {
  return (process.env.PAYMENT_CURRENCY ?? "USD").toLowerCase();
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",
  label: "Secure payment via Stripe",

  async createCheckoutSession(order) {
    const snapshot = parseSnapshot(order);
    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("client_reference_id", order.number);
    form.set("success_url", `${baseUrl()}/checkout/result?order=${order.number}&from=provider`);
    form.set("cancel_url", `${baseUrl()}/checkout/result?order=${order.number}&from=cancel`);
    snapshot.items.forEach((item, i) => {
      form.set(`line_items[${i}][quantity]`, String(item.qty));
      form.set(`line_items[${i}][price_data][currency]`, currency());
      form.set(`line_items[${i}][price_data][unit_amount]`, String(item.unitPrice));
      form.set(`line_items[${i}][price_data][product_data][name]`, item.name.slice(0, 100));
    });
    if (snapshot.shipping > 0) {
      const i = snapshot.items.length;
      form.set(`line_items[${i}][quantity]`, "1");
      form.set(`line_items[${i}][price_data][currency]`, currency());
      form.set(`line_items[${i}][price_data][unit_amount]`, String(snapshot.shipping));
      form.set(`line_items[${i}][price_data][product_data][name]`, "Shipping");
    }
    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      throw new Error(`Stripe checkout creation failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const json = (await res.json()) as { id: string; url: string };
    return { redirectUrl: json.url, providerRef: json.id };
  },

  async verifyPayment(order) {
    if (!order.provider_ref) return { state: "pending", reference: "no-session" };
    const res = await fetch(`${API}/checkout/sessions/${order.provider_ref}`, {
      headers: { Authorization: `Bearer ${key()}` },
    });
    if (!res.ok) return { state: "pending", reference: `verify-http-${res.status}` };
    const json = (await res.json()) as { payment_status?: string; status?: string };
    if (json.payment_status === "paid") return { state: "paid", reference: order.provider_ref };
    if (json.status === "expired") return { state: "cancelled", reference: order.provider_ref };
    return { state: "pending", reference: order.provider_ref };
  },

  async parseWebhook(rawBody, headers) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    const header = headers.get("stripe-signature") ?? "";
    const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) throw new Error("missing Stripe signature");
    const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("invalid Stripe webhook signature");
    }
    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: { object?: { id?: string; client_reference_id?: string; payment_status?: string } };
    };
    const obj = event.data?.object;
    if (event.type === "checkout.session.completed" && obj?.payment_status === "paid") {
      return {
        orderNumber: obj.client_reference_id ?? null,
        providerRef: obj.id ?? null,
        state: "paid",
        reference: obj.id ?? "stripe",
      };
    }
    if (event.type === "checkout.session.expired") {
      return {
        orderNumber: obj?.client_reference_id ?? null,
        providerRef: obj?.id ?? null,
        state: "cancelled",
        reference: obj?.id ?? "stripe",
      };
    }
    return null;
  },
};
