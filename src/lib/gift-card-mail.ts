import { getEmailProvider } from "./email";
import { giftCardBuyerEmail, giftCardFriendEmail } from "./email/templates";
import { claimGiftEmail, releaseGiftEmail, type GiftCardRecord } from "./gift-cards";
import { baseUrl } from "./notify-order";
import { parseSnapshot, type OrderRecord } from "./orders";

/**
 * Emails an order's gift cards: each friend gets their own card, and the buyer
 * gets one copy covering every card in the order.
 *
 * `max` is how many sends a card may have had after this one. The shop's
 * "payment received" passes 1, so pressing the button twice mails once; a
 * resend passes the cap. A send that fails hands its claim back and is
 * reported, so the page can say "copy the code and send it on Instagram".
 */
export async function sendGiftCardEmails(
  order: OrderRecord,
  cards: GiftCardRecord[],
  max: number,
): Promise<{ sent: number[]; failed: number[] }> {
  const claimed: GiftCardRecord[] = [];
  for (const card of cards) {
    if (card.code && (await claimGiftEmail(card.id, max))) claimed.push(card);
  }
  if (!claimed.length) return { sent: [], failed: [] };

  const snapshot = parseSnapshot(order);
  const mailer = getEmailProvider();
  const failed = new Set<number>();

  for (const card of claimed.filter((c) => c.delivery === "friend" && c.to_email)) {
    try {
      await mailer.send(giftCardFriendEmail(card, snapshot.customer.fullName, `${baseUrl()}/shop`));
    } catch (err) {
      console.error(`[gift card ${card.id}] could not email the friend:`, err);
      failed.add(card.id);
      await releaseGiftEmail(card.id);
    }
  }

  try {
    await mailer.send(
      giftCardBuyerEmail(snapshot.customer.email, order.number, claimed, `${baseUrl()}/order/${order.number}`),
    );
  } catch (err) {
    console.error(`[order ${order.number}] could not email the buyer their gift card copy:`, err);
    // the buyer's copy is the only delivery of a card bought for themselves
    for (const card of claimed.filter((c) => c.delivery !== "friend" && !failed.has(c.id))) {
      failed.add(card.id);
      await releaseGiftEmail(card.id);
    }
  }

  return { sent: claimed.filter((c) => !failed.has(c.id)).map((c) => c.id), failed: [...failed] };
}
