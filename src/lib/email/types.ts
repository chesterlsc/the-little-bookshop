import { SITE } from "@/content/site";

export interface Mail {
  to: string;
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

export function ordersAddress(): string {
  return process.env.ORDERS_EMAIL || SITE.ordersEmail;
}
