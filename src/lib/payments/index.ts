import { devProvider } from "./dev";
import { paymongoProvider } from "./paymongo";
import { stripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";

const providers: Record<string, PaymentProvider> = {
  dev: devProvider,
  paymongo: paymongoProvider,
  stripe: stripeProvider,
};

/**
 * Chosen via PAYMENT_PROVIDER (dev | paymongo | stripe).
 * Defaults to the dev simulator so the site works out of the box
 * without ever pretending a real payment happened.
 */
export function getPaymentProvider(): PaymentProvider {
  const id = process.env.PAYMENT_PROVIDER ?? "dev";
  const provider = providers[id];
  if (!provider) {
    throw new Error(
      `Unknown PAYMENT_PROVIDER "${id}". Expected one of: ${Object.keys(providers).join(", ")}`,
    );
  }
  return provider;
}

export function isDevPayments(): boolean {
  return getPaymentProvider().id === "dev";
}
