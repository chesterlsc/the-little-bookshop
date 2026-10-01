import Image from "next/image";
import { notFound } from "next/navigation";
import { GiftIssue } from "@/components/gift-issue";
import type { GiftCardView } from "@/components/gift-card-ready";
import { giftCardsByToken } from "@/lib/gift-cards";
import { getOrder, parseSnapshot } from "@/lib/orders";

export const metadata = { title: "Gift card · for the shop", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The shop's own page for one order's gift cards, opened from the link in the
 * shop's order email. The token in the address is the only key to it.
 *
 * Opening it does nothing: a mail app that follows links to preview them
 * cannot create a card. Only the button, a POST, does.
 */
export default async function GiftIssuePage({ params }: PageProps<"/gift-cards/issue/[token]">) {
  const { token } = await params;
  const cards = await giftCardsByToken(decodeURIComponent(token));
  if (!cards.length) notFound();
  const order = await getOrder(cards[0].order_number);
  if (!order) notFound();
  const snapshot = parseSnapshot(order);

  const made: GiftCardView[] = cards
    .filter((c) => c.code && c.expires_at)
    .map((c) => ({
      code: c.code!,
      amount: c.amount,
      expiresAt: c.expires_at!,
      delivery: c.delivery,
      toName: c.to_name,
      fromName: c.from_name,
      toEmail: c.to_email,
      emailedAt: c.emailed_at,
    }));

  return (
    // over the whole shop: this page is for one person with one thing to decide
    <div className="fixed inset-0 z-[95] overflow-y-auto bg-paper">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-10 pt-6">
        <Image src="/brand/logo_wordmark_h.png" alt="The Little Bookshop" width={1127} height={120} className="mx-auto h-5 w-auto" />
        <GiftIssue
          token={token}
          orderNumber={order.number}
          cancelled={order.status === "cancelled"}
          toCheck={order.total}
          buyer={{ name: snapshot.customer.fullName, email: snapshot.customer.email, instagram: snapshot.customer.instagram }}
          payingBy={order.provider_ref}
          screenshot={(order.proofs_sent ?? 0) > 0}
          pending={cards.map((c) => ({ amount: c.amount, delivery: c.delivery, toName: c.to_name, toEmail: c.to_email }))}
          made={made}
        />
      </div>
    </div>
  );
}
