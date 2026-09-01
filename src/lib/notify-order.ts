import { getEmailProvider } from "./email";
import { businessOrderEmail, customerOrderEmail } from "./email/templates";
import { ordersAddress } from "./email/types";
import { claimEmailSend, getOrder, parseSnapshot, releaseEmailSend, type OrderRecord } from "./orders";

export function baseUrl(): string {
  return (process.env.PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Sends the two order emails, exactly once per order.
 *
 * With manual payment there is no "payment confirmed" moment to hang these on,
 * so they go out as soon as the order is placed: the shop needs the details to
 * watch for the transfer, and the customer needs their order number to quote on
 * Instagram. `claimEmailSend` makes this safe to call more than once.
 *
 * Never throws: a mail outage must not lose an order that is already saved.
 */
export async function notifyNewOrder(orderNumber: string): Promise<OrderRecord | null> {
  const order = await getOrder(orderNumber);
  if (!order) return null;
  if (!(await claimEmailSend(order.number))) return order;

  try {
    const snapshot = parseSnapshot(order);
    const mailer = getEmailProvider();
    const payUrl = `${baseUrl()}/order/${order.number}/pay`;
    const placedAt = new Date(order.created_at).toUTCString();
    await mailer.send(
      businessOrderEmail(ordersAddress(), order.number, snapshot, "awaiting payment", placedAt),
    );
    await mailer.send(customerOrderEmail(order.number, snapshot, payUrl));
  } catch (err) {
    // Hand the claim back so a later visit retries, rather than silently
    // losing the only notification the shop gets about a real order.
    await releaseEmailSend(order.number);
    console.error(`[order ${order.number}] email delivery failed, will retry:`, err);
  }
  return order;
}
