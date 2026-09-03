import { SITE } from "@/content/site";

export interface Mail {
  /** one address, or several for the shop's own copies */
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  id: string;
  send(mail: Mail): Promise<void>;
}

/**
 * Both default to the shop's own mailbox, so mail reaches a real inbox even if
 * a deploy forgets these. Override EMAIL_FROM when sending through a provider
 * that requires its own verified domain.
 */
export function fromAddress(): string {
  return process.env.EMAIL_FROM || `${SITE.name} <${SITE.sendingEmail}>`;
}

/**
 * Everyone who should receive order and contact mail. ORDERS_EMAIL overrides
 * and may list several, comma separated.
 */
export function ordersAddress(): string[] {
  const override = process.env.ORDERS_EMAIL;
  if (!override) return SITE.orderRecipients;
  return override.split(",").map((a) => a.trim()).filter(Boolean);
}
