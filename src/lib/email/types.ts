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

export function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "The Little Bookshop <hello@example.com>";
}

export function ordersAddress(): string {
  return process.env.ORDERS_EMAIL ?? "orders@example.com";
}
