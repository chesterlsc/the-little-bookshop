import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrder, parseSnapshot } from "@/lib/orders";
import { Badge, ButtonLink, Section } from "@/components/ui";
import { PaymentInstructions } from "@/components/payment-instructions";
import { CopyButton } from "@/components/copy-button";
import { ClearCartOnMount } from "@/components/clear-cart-on-mount";
import { SprigDivider } from "@/components/illustrations";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Complete your payment", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PayPage({ params }: PageProps<"/order/[number]/pay">) {
  const { number } = await params;
  const order = await getOrder(decodeURIComponent(number));
  if (!order) notFound();
  // only an unpaid order may be asked for money; every other status is already
  // told correctly by the status page, so send them there instead of re-soliciting
  if (order.status !== "awaiting_payment") redirect(`/order/${order.number}`);
  const snapshot = parseSnapshot(order);

  return (
    <div className="pb-nav">
      {/* the order is saved server-side now, so the basket can safely empty —
          but only for the browser that just placed this order */}
      <ClearCartOnMount orderNumber={order.number} />

      <Section className="pt-8">
        <div className="mx-auto max-w-2xl">
          {/* ── order received ── */}
          <div className="text-center">
            <h1 className="hero-h1 text-balance font-display font-bold text-ink-900">
              Your little order is almost ours ♡
            </h1>
            <p className="story-line mx-auto mt-3 max-w-[42ch] text-pretty text-[1.08rem] leading-relaxed text-ink-600">
              Complete your payment using GCash or MariBank, then send us your payment screenshot
              on Instagram so we can confirm your order.
            </p>
          </div>

          {/* ── how to pay ── */}
          <div className="mt-6">
            <PaymentInstructions
              orderNumber={order.number}
              customerName={snapshot.customer.fullName}
              total={snapshot.total}
            />
          </div>

          {/* ── the order slip ── */}
          <div className="clay mt-8 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brown-500/12 bg-paper p-5">
              <div>
                <p className="eyebrow mb-1">Your order number</p>
                <p className="font-display text-[2rem] font-bold leading-none text-ink-900 sm:text-[2.4rem]">
                  #{order.number}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="taupe">Awaiting payment</Badge>
                <CopyButton value={order.number} label="order number" />
              </div>
            </div>

            <div className="p-5">
              <dl className="space-y-1.5 font-sans text-[0.95rem]">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-600">Name</dt>
                  <dd className="text-right font-bold">{snapshot.customer.fullName}</dd>
                </div>
              </dl>

              <ul className="mt-4 space-y-2.5">
                {snapshot.items.map((item, i) => (
                  <li key={i} className="stitch bg-paper p-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-display font-bold">{item.name}</p>
                      <p className="shrink-0 font-display font-semibold">
                        {formatMoney(item.lineTotal)}
                      </p>
                    </div>
                    <p className="font-sans text-xs text-ink-600">
                      Qty {item.qty} · {formatMoney(item.unitPrice)} each
                    </p>
                    {item.details.length > 0 && (
                      <ul className="mt-1 font-sans text-[0.86rem] text-ink-600">
                        {item.details.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    )}
                    {item.titles && item.titles.length > 0 && (
                      <ol className="mt-1.5 grid list-decimal gap-0.5 pl-5 font-sans text-[0.86rem] text-ink-600">
                        {item.titles.map((t, n) => (
                          <li key={n}>
                            {t.title}
                            {t.author ? `, ${t.author}` : ""}
                          </li>
                        ))}
                      </ol>
                    )}
                    {item.notes && (
                      <p className="mt-1.5 font-sans text-[0.86rem] italic text-ink-600">
                        Note: {item.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 border-t border-brown-500/12 pt-4 font-sans text-[0.95rem]">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-600">Subtotal</dt>
                  <dd className="font-bold">{formatMoney(snapshot.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-600">Shipping</dt>
                  <dd className="font-bold">
                    {snapshot.shipping === 0 ? "Free" : formatMoney(snapshot.shipping)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-brown-500/15 pt-2">
                  <dt className="font-display text-[1.05rem] font-bold">Final amount to pay</dt>
                  <dd className="font-display text-[1.35rem] font-bold text-ink-900">
                    {formatMoney(snapshot.total)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <SprigDivider className="mx-auto mt-10 h-9 w-64 opacity-90" />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <ButtonLink href={`/order/${order.number}`} variant="quiet">
              View order status
            </ButtonLink>
            <ButtonLink href="/shop" variant="quiet">
              Keep browsing
            </ButtonLink>
          </div>
          <p className="mt-4 text-center font-sans text-xs text-ink-600">
            Bookmark this page — it is where your payment details live.{" "}
            <Link href="/contact" className="btn-link">
              Need help?
            </Link>
          </p>
        </div>
      </Section>
    </div>
  );
}
