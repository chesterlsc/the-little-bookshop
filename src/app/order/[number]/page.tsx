import { notFound } from "next/navigation";
import { getOrder, parseSnapshot } from "@/lib/orders";
import { MAX_PROOFS } from "@/lib/orders-types";
import { PaymentProof } from "@/components/payment-proof";
import { Badge, ButtonLink, Eyebrow, Section } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { FolkDivider, ShelfCat } from "@/components/illustrations";
import { ClearCartOnMount } from "@/components/clear-cart-on-mount";
import { GiftCardReady, ResendGiftEmail, type GiftCardView } from "@/components/gift-card-ready";
import { giftCardsByOrder } from "@/lib/gift-cards";
import { INSTAGRAM_HANDLE, SITE } from "@/content/site";

/** "11:05 am", on the shop's clock. */
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).toLowerCase();

export const metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_COPY: Record<
  string,
  { badge: string; tone: "sage" | "blush" | "taupe" | "rose"; line: string }
> = {
  awaiting_payment: {
    badge: "Awaiting payment",
    tone: "taupe",
    line: "We've saved your order. Complete your payment and send us your screenshot on Instagram, and we'll confirm it from there.",
  },
  payment_submitted: {
    badge: "Payment submitted",
    tone: "blush",
    line: "Thank you! We've got your screenshot and we're checking the transfer. We'll confirm shortly.",
  },
  confirmed: {
    badge: "Confirmed",
    tone: "sage",
    line: "Payment verified and your order is in the queue. We'll let you know when it's being made.",
  },
  preparing: {
    badge: "Preparing",
    tone: "sage",
    line: "Your tiny things are being printed, assembled and packed.",
  },
  shipped: { badge: "Shipped", tone: "sage", line: "On its way to you." },
  completed: { badge: "Completed", tone: "sage", line: "Delivered. Thank you for building a little library with us." },
  cancelled: {
    badge: "Cancelled",
    tone: "rose",
    line: "This order was cancelled. Nothing was charged. You're welcome to order again any time.",
  },
};

export default async function OrderPage({ params }: PageProps<"/order/[number]">) {
  const { number } = await params;
  const order = await getOrder(decodeURIComponent(number));
  if (!order) notFound();
  const snapshot = parseSnapshot(order);
  const status = STATUS_COPY[order.status] ?? {
    badge: order.status.replace(/_/g, " "),
    tone: "taupe" as const,
    line: "This order is being handled by hand. Write to us with your order number and we'll tell you where it stands.",
  };
  const c = snapshot.customer;

  // Gift cards bought in this order. A card has no code until the shop has
  // confirmed the payment, so "made" is the whole difference between the two
  // things this page can say about it.
  const giftCards = await giftCardsByOrder(order.number);
  const made: GiftCardView[] = giftCards
    .filter((g) => g.code && g.expires_at)
    .map((g) => ({
      code: g.code!,
      amount: g.amount,
      expiresAt: g.expires_at!,
      delivery: g.delivery,
      toName: g.to_name,
      fromName: g.from_name,
      toEmail: g.to_email,
      emailedAt: g.emailed_at,
    }));
  const wrapping = giftCards.length > 0 && made.length === 0 && order.status !== "cancelled";
  // an order that is only a gift card leads with the card, not with a parcel's progress
  const giftOnly = Boolean(snapshot.digital) && made.length > 0;
  const allFriends = made.length > 0 && made.every((g) => g.delivery === "friend");
  const friendName = (g: GiftCardView) => g.toName?.trim() || "your friend";
  const giftHeadline =
    made.length > 1
      ? "Your gift cards are ready"
      : allFriends
        ? `Your gift card is on its way to ${friendName(made[0])}`
        : "Your gift card is ready";

  return (
    <div className="pb-nav">
      <ClearCartOnMount orderNumber={order.number} />
      <Section className="pt-10">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <Eyebrow className="mb-2">{giftOnly ? `Order ${order.number}` : "Order"}</Eyebrow>
            <h1 className="text-3xl font-bold">{giftOnly ? giftHeadline : order.number}</h1>
            <div className="mt-2">
              {giftOnly ? <Badge tone="sage">{allFriends ? "Sent" : "Ready"}</Badge> : <Badge tone={status.tone}>{status.badge}</Badge>}
            </div>
            {!giftOnly && (
              <p className="mx-auto mt-2 max-w-[52ch] font-sans text-[0.95rem] text-ink-600">{status.line}</p>
            )}
            <p className="mt-1 font-sans text-xs text-ink-400">
              Placed {new Date(order.created_at).toUTCString()}
            </p>
            {order.tracking_number && (
              <div className="stitch mx-auto mt-4 max-w-sm bg-cream-50 px-4 py-3">
                <p className="font-sans text-xs uppercase tracking-[0.14em] text-ink-400">
                  {order.courier ?? "Courier"}
                </p>
                <p className="mt-0.5 font-display text-lg font-bold tracking-wide text-ink-900">
                  {order.tracking_number}
                </p>
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-link mt-1 inline-block font-sans text-sm"
                  >
                    Track this parcel
                  </a>
                )}
              </div>
            )}
          </div>

          {wrapping && (
            <div className="clay mt-6 p-5 text-center sm:p-6">
              <ShelfCat className="mx-auto h-20 w-24" />
              <h2 className="mt-2 font-display text-xl font-bold">Your gift card is being wrapped</h2>
              <p className="mx-auto mt-1.5 max-w-[46ch] font-sans text-[0.95rem] leading-relaxed text-ink-600">
                {order.status === "awaiting_payment"
                  ? "Pay by GCash or MariBank and send us your screenshot. Once we've checked it, your code shows up right here."
                  : "We're checking your payment. Once that's done, your code shows up right here."}
              </p>
              <p className="story-line mt-2 text-sm text-ink-600">
                We&apos;ll also email it, and send the card on Instagram from @{INSTAGRAM_HANDLE}.
              </p>
            </div>
          )}

          {made.map((g) => (
            <div key={g.code} className="clay mt-6 p-5 text-center sm:p-6">
              {!giftOnly && (
                <h2 className="mb-4 font-display text-xl font-bold">
                  {g.delivery === "friend" ? `Your gift card is on its way to ${friendName(g)}` : "Your gift card is ready"}
                </h2>
              )}
              <GiftCardReady card={g} />
              {g.delivery === "friend" ? (
                <>
                  <p className="mx-auto mt-3 max-w-[46ch] font-sans text-[0.95rem] leading-relaxed text-ink-600">
                    {g.emailedAt
                      ? `We emailed it to ${g.toEmail} at ${timeOf(g.emailedAt)}. Here's the code too, just in case.`
                      : `We couldn't email it to ${g.toEmail}. Copy the code and send it on Instagram instead, or try the email again.`}
                  </p>
                  <ResendGiftEmail by={{ order: order.number }} className="mt-3" />
                  <p className="mt-2 font-sans text-sm text-ink-600">
                    Not there? Ask {friendName(g)} to check their spam folder.
                  </p>
                </>
              ) : (
                <p className="mx-auto mt-3 max-w-[46ch] font-sans text-[0.95rem] leading-relaxed text-ink-600">
                  Screenshot the card and send it on. We&apos;ve also emailed it to you and sent it on Instagram.
                </p>
              )}
            </div>
          ))}

          <div className="clay mt-6 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Tiny things ordered</h2>
            <ul className="mt-3 space-y-3">
              {snapshot.items.map((item, i) => (
                <li key={i} className="stitch bg-paper p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display font-bold">{item.name}</p>
                    <p className="font-display font-semibold">{formatMoney(item.lineTotal)}</p>
                  </div>
                  <p className="font-sans text-xs text-ink-400">
                    Qty {item.qty} · {formatMoney(item.unitPrice)} each
                  </p>
                  <ul className="mt-1.5 font-sans text-sm text-ink-600">
                    {item.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  {item.titles && item.titles.length > 0 && (
                    <ol className="mt-2 grid list-decimal gap-0.5 pl-5 font-sans text-sm text-ink-600 sm:grid-cols-2">
                      {item.titles.map((t, j) => (
                        <li key={j}>
                          {t.title}
                          {t.author ? `, ${t.author}` : ""}
                        </li>
                      ))}
                    </ol>
                  )}
                  {item.notes && (
                    <p className="mt-1.5 font-sans text-sm italic text-ink-400">“{item.notes}”</p>
                  )}
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-brown-500/15 pt-3 font-sans text-[0.95rem]">
              <div className="flex justify-between">
                <dt className="text-ink-600">Subtotal</dt>
                <dd className="font-bold">{formatMoney(order.subtotal)}</dd>
              </div>
              {snapshot.discount > 0 && (
                <div className="flex justify-between text-sage-700">
                  <dt>Discount{snapshot.discountCode ? ` (${snapshot.discountCode})` : ""}</dt>
                  <dd className="font-bold">−{formatMoney(snapshot.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-600">Shipping</dt>
                <dd className="font-bold">{snapshot.digital ? "None, it's digital" : formatMoney(order.shipping)}</dd>
              </div>
              {snapshot.giftCard && (
                <div className="flex justify-between text-rose-700">
                  <dt>Gift card ••{snapshot.giftCard.last4}</dt>
                  <dd className="font-bold">−{formatMoney(snapshot.giftCard.applied)}</dd>
                </div>
              )}
              <div className="flex justify-between text-[1.05rem]">
                <dt className="font-display font-bold">{snapshot.giftCard ? "To pay" : "Total"}</dt>
                <dd className="font-display font-bold">
                  {formatMoney(order.total)} {order.currency}
                </dd>
              </div>
            </dl>
          </div>

          {!snapshot.digital && (
          <div className="clay mt-4 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Shipping to</h2>
            <p className="mt-2 font-sans text-[0.95rem] leading-relaxed text-ink-600">
              {c.fullName}
              <br />
              {c.address1}
              <br />
              Brgy. {c.barangay}
              <br />
              {c.city}, {c.province} {c.postalCode}
            </p>
            {c.addressNotes && (
              <p className="mt-2 font-sans text-sm italic text-ink-400">“{c.addressNotes}”</p>
            )}
            {c.instagram && (
              <p className="mt-2 font-sans text-sm text-ink-600">
                Instagram: <span className="font-bold">@{c.instagram}</span>
              </p>
            )}
          </div>
          )}

          {order.status === "awaiting_payment" && (
            <div className="mt-5 text-center">
              <ButtonLink href={`/order/${order.number}/pay`} className="btn-lg">
                View payment instructions
              </ButtonLink>
            </div>
          )}
          {order.status === "payment_submitted" && (order.proofs_sent ?? 0) < MAX_PROOFS && (
            <div className="clay mt-5 p-5">
              <h2 className="font-display text-lg font-bold">Sent the wrong screenshot?</h2>
              <p className="mt-1 font-sans text-[0.95rem] leading-relaxed text-ink-600">
                Send us another one and we&apos;ll use the latest, or message us on Instagram.
              </p>
              <div className="mt-4">
                <PaymentProof orderNumber={order.number} method={order.provider_ref ?? undefined} />
              </div>
            </div>
          )}
          {order.status === "cancelled" && (
            <div className="mt-5 text-center">
              <ButtonLink href="/shop">Browse the shop</ButtonLink>
            </div>
          )}

          <FolkDivider className="mx-auto mt-8 h-6 w-52 opacity-80" />
          <p className="mt-2 text-center font-sans text-sm text-ink-600">
            Questions about this order? Write to{" "}
            <a href={`mailto:${SITE.contactEmail}`} className="font-bold text-sage-700 underline">
              {SITE.contactEmail}
            </a>{" "}
            and mention <strong>{order.number}</strong>.
          </p>
        </div>
      </Section>
    </div>
  );
}
