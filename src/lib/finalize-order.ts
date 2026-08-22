import { baseUrl } from "./payments/types";
import { getEmailProvider } from "./email";
import { businessOrderEmail, customerOrderEmail } from "./email/templates";
import { ordersAddress } from "./email/types";
import { claimEmailSend, getOrder, markPaid, parseSnapshot, type OrderRecord } from "./orders";

/**
 * The single place an order becomes "paid".
 * Called from BOTH the webhook and the verify endpoint; whichever arrives
 * first wins, and emails go out exactly once (claimEmailSend guards it).
 */
export async function finalizePaidOrder(orderNumber: string, reference: string): Promise<OrderRecord | null> {
  const order = getOrder(orderNumber);
  if (!order) return null;

  markPaid(order.number, reference);

  if (claimEmailSend(order.number)) {
    const snapshot = parseSnapshot(order);
    const mailer = getEmailProvider();
    const orderUrl = `${baseUrl()}/order/${order.number}`;
    const placedAt = new Date(order.created_at).toUTCString();
    try {
      await mailer.send(businessOrderEmail(ordersAddress(), order.number, snapshot, reference, placedAt));
      await mailer.send(customerOrderEmail(order.number, snapshot, orderUrl));
    } catch (err) {
      // The order stays paid; log so the shop can resend manually.
      console.error(`[order ${order.number}] email delivery failed:`, err);
    }
  }
  return getOrder(orderNumber) ?? null;
}
