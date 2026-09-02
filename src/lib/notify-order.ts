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
 * The two sends are deliberately not equal. The shop's copy IS the order
 * record, so if it fails this throws and the caller must not report success:
 * the order row lives in per-instance storage that the next request usually
 * cannot see, making a swallowed failure an order nobody ever learns about.
 * The customer's copy is a convenience (they already have the same details on
 * screen), so a bad address only gets logged.
 */
export async function notifyNewOrder(orderNumber: string): Promise<OrderRecord | null> {
  const order = await getOrder(orderNumber);
  if (!order) return null;
  if (!(await claimEmailSend(order.number))) return order;

  try {
    const snapshot = parseSnapshot(order);
    const mailer = getEmailProvider();
    const placedAt = new Date(order.created_at).toUTCString();
    await mailer.send(
      businessOrderEmail(ordersAddress(), order.number, snapshot, "awaiting payment", placedAt),
    );

    try {
      await mailer.send(
        customerOrderEmail(order.number, snapshot, `${baseUrl()}/order/${order.number}/pay`),
      );
    } catch (err) {
      console.error(`[order ${order.number}] customer copy failed, shop was notified:`, err);
    }
  } catch (err) {
    // Hand the claim back so the customer's retry sends for real.
    await releaseEmailSend(order.number);
    throw err;
  }
  return order;
}
