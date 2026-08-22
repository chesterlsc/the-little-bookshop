import { notFound } from "next/navigation";
import { getOrder, parseSnapshot } from "@/lib/orders";
import { Badge, ButtonLink, Eyebrow, Section } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { FolkDivider } from "@/components/illustrations";
import { SITE } from "@/content/site";

export const metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_COPY: Record<string, { badge: string; tone: "sage" | "blush" | "taupe" | "rose"; line: string }> = {
  paid: { badge: "Paid & confirmed", tone: "sage", line: "Payment verified. The studio is on it, and we'll email when it ships." },
  pending: { badge: "Awaiting payment", tone: "taupe", line: "This order is reserved but not yet paid. Complete payment to confirm it." },
  failed: { badge: "Payment failed", tone: "rose", line: "The payment didn't go through and nothing was charged. You can try checkout again." },
  cancelled: { badge: "Cancelled", tone: "blush", line: "This checkout was cancelled before payment. No charge was made." },
};

export default async function OrderPage({ params }: PageProps<"/order/[number]">) {
  const { number } = await params;
  const order = getOrder(decodeURIComponent(number));
  if (!order) notFound();
  const snapshot = parseSnapshot(order);
  const status = STATUS_COPY[order.status] ?? STATUS_COPY.pending;
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
              {c.address2 && (
                <>
                  <br />
                  {c.address2}
                </>
              )}
              <br />
              {c.city}
              {c.region ? `, ${c.region}` : ""} {c.postalCode}
              <br />
              {c.country}
            </p>
            {c.deliveryNotes && (
              <p className="mt-2 font-sans text-sm italic text-ink-400">“{c.deliveryNotes}”</p>
            )}
          </div>

          {order.status === "pending" && (
            <div className="mt-5 text-center">
              <ButtonLink href={`/checkout/result?order=${order.number}&from=refresh`}>
                Check payment status
              </ButtonLink>
            </div>
          )}
          {(order.status === "failed" || order.status === "cancelled") && (
            <div className="mt-5 text-center">
              <ButtonLink href="/checkout">Try checkout again</ButtonLink>
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
