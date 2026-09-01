import { notFound } from "next/navigation";
import { getOrder, parseSnapshot } from "@/lib/orders";
import { Badge, ButtonLink, Eyebrow, Section } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { FolkDivider } from "@/components/illustrations";
import { SITE } from "@/content/site";

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
  const order = getOrder(decodeURIComponent(number));
  if (!order) notFound();
  const snapshot = parseSnapshot(order);
  const status = STATUS_COPY[order.status] ?? {
    badge: order.status.replace(/_/g, " "),
    tone: "taupe" as const,
    line: "This order is being handled by hand. Write to us with your order number and we'll tell you where it stands.",
  };
  const c = snapshot.customer;

  return (
    <div className="pb-nav">
      <Section className="pt-10">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <Eyebrow className="mb-2">Order</Eyebrow>
            <h1 className="text-3xl font-bold">{order.number}</h1>
            <div className="mt-2">
              <Badge tone={status.tone}>{status.badge}</Badge>
            </div>
            <p className="mx-auto mt-2 max-w-[52ch] font-sans text-[0.95rem] text-ink-600">{status.line}</p>
            <p className="mt-1 font-sans text-xs text-ink-400">
              Placed {new Date(order.created_at).toUTCString()}
            </p>
          </div>

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
              <div className="flex justify-between">
                <dt className="text-ink-600">Shipping</dt>
                <dd className="font-bold">{formatMoney(order.shipping)}</dd>
              </div>
              <div className="flex justify-between text-[1.05rem]">
                <dt className="font-display font-bold">Total</dt>
                <dd className="font-display font-bold">
                  {formatMoney(order.total)} {order.currency}
                </dd>
              </div>
            </dl>
          </div>

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

          {order.status === "awaiting_payment" && (
            <div className="mt-5 text-center">
              <ButtonLink href={`/order/${order.number}/pay`} className="btn-lg">
                View payment instructions
              </ButtonLink>
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
