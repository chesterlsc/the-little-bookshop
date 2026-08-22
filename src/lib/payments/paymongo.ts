import { createHmac, timingSafeEqual } from "node:crypto";
import { parseSnapshot } from "../orders";
import { baseUrl, type PaymentProvider } from "./types";

/**
 * PayMongo hosted Checkout Sessions (cards, GCash, Maya, etc).
 * Docs: https://developers.paymongo.com/reference/checkout-session-resource
 *
 * Required env:
 *   PAYMONGO_SECRET_KEY      : sk_test_… / sk_live_…
 *   PAYMONGO_WEBHOOK_SECRET  : whsk_… (from the created webhook)
 * Note: PayMongo settles in PHP; set PAYMENT_CURRENCY=PHP and price the
 * catalog accordingly, or keep another provider for USD.
 */

const API = "https://api.paymongo.com/v1";

function authHeader(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not set");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

function currency(): string {
  return process.env.PAYMENT_CURRENCY ?? "PHP";
}

export const paymongoProvider: PaymentProvider = {
  id: "paymongo",
  label: "Secure payment via PayMongo (cards, GCash, Maya)",

  async createCheckoutSession(order) {
    const snapshot = parseSnapshot(order);
    const items = snapshot.items.map((item) => ({
      name: item.name.slice(0, 100),
      quantity: item.qty,
      amount: item.unitPrice,
      currency: currency(),
      description: item.details.slice(0, 2).join(" · ").slice(0, 200) || undefined,
    }));
    if (snapshot.shipping > 0) {
      items.push({
        name: "Shipping",
        quantity: 1,
        amount: snapshot.shipping,
        currency: currency(),
        description: undefined,
      });
    }
    const res = await fetch(`${API}/checkout_sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader() },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: items,
            payment_method_types: ["card", "gcash", "paymaya"],
            reference_number: order.number,
            description: `The Little Bookshop order ${order.number}`,
            send_email_receipt: false,
            show_line_items: true,
            success_url: `${baseUrl()}/checkout/result?order=${order.number}&from=provider`,
            cancel_url: `${baseUrl()}/checkout/result?order=${order.number}&from=cancel`,
          },
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`PayMongo checkout creation failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      data: { id: string; attributes: { checkout_url: string } };
    };
    return { redirectUrl: json.data.attributes.checkout_url, providerRef: json.data.id };
  },

  async verifyPayment(order) {
    if (!order.provider_ref) return { state: "pending", reference: "no-session" };
    const res = await fetch(`${API}/checkout_sessions/${order.provider_ref}`, {
      headers: { Authorization: authHeader() },
    });
    if (!res.ok) return { state: "pending", reference: `verify-http-${res.status}` };
    const json = (await res.json()) as {
      data: {
        attributes: {
          payment_intent?: { attributes?: { status?: string } };
          payments?: { attributes?: { status?: string } }[];
          status?: string;
        };
      };
    };
    const attrs = json.data.attributes;
    const paid =
      attrs.payments?.some((p) => p.attributes?.status === "paid") ||
      attrs.payment_intent?.attributes?.status === "succeeded";
    if (paid) return { state: "paid", reference: order.provider_ref };
    if (attrs.status === "expired") return { state: "cancelled", reference: order.provider_ref };
    return { state: "pending", reference: order.provider_ref };
  },

  async parseWebhook(rawBody, headers) {
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (!secret) throw new Error("PAYMONGO_WEBHOOK_SECRET is not set");
    const header = headers.get("paymongo-signature") ?? "";
    // header format: t=…,te=…,li=…  (te = test mode signature, li = live mode)
    const parts = Object.fromEntries(
      header.split(",").map((p) => p.split("=") as [string, string]),
    );
    const timestamp = parts.t;
    const signature = parts.li || parts.te;
    if (!timestamp || !signature) throw new Error("missing PayMongo signature");
    const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("invalid PayMongo webhook signature");
    }
    const event = JSON.parse(rawBody) as {
      data?: {
        attributes?: {
          type?: string;
          data?: {
            id?: string;
            attributes?: { reference_number?: string; status?: string };
          };
        };
      };
    };
    const type = event.data?.attributes?.type ?? "";
    const inner = event.data?.attributes?.data;
    if (type === "checkout_session.payment.paid") {
      return {
        orderNumber: inner?.attributes?.reference_number ?? null,
        providerRef: inner?.id ?? null,
        state: "paid",
        reference: inner?.id ?? "paymongo",
      };
    }
    if (type === "payment.failed") {
      return {
        orderNumber: inner?.attributes?.reference_number ?? null,
        providerRef: inner?.id ?? null,
        state: "failed",
        reference: inner?.id ?? "paymongo",
      };
    }
    return null; // event we don't act on
  },
};
