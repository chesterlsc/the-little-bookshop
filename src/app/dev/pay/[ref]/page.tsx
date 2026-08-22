import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders";
import { isDevPayments } from "@/lib/payments";
import { formatMoney } from "@/lib/money";
import { DevPayButtons } from "./buttons";

export const metadata = { title: "Simulated payment (dev)", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * DEV-ONLY payment simulator. It stands in for the provider's hosted page so
 * the full order flow can be exercised locally. It is unreachable when a real
 * provider is configured, and never claims to be a real payment.
 */
export default async function DevPayPage({ params }: PageProps<"/dev/pay/[ref]">) {
  if (!isDevPayments()) notFound();
  const { ref } = await params;
  const order = getOrder(decodeURIComponent(ref));
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-md px-4 pb-nav pt-10">
      <div className="stitch bg-sun-200/40 px-4 py-2 text-center font-sans text-xs font-bold tracking-wide text-brown-700">
        DEVELOPMENT MODE · SIMULATED PAYMENT PAGE · NO REAL MONEY MOVES HERE
      </div>
      <div className="clay mt-4 p-6">
        <p className="eyebrow">Pretend Payments Inc.</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Order {order.number}</h1>
        <dl className="mt-3 space-y-1.5 font-sans text-[0.95rem]">
          <div className="flex justify-between">
            <dt className="text-ink-600">Amount</dt>
            <dd className="font-display font-bold">{formatMoney(order.total)} {order.currency}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Status</dt>
            <dd className="font-bold">{order.status}</dd>
          </div>
        </dl>
        <p className="mt-4 font-sans text-sm text-ink-600">
          On a real deployment this is the payment provider's secure page (PayMongo or
          Stripe). Choose an outcome to simulate; the shop still verifies it
          server-side, exactly like a real webhook.
        </p>
        <DevPayButtons orderNumber={order.number} />
      </div>
    </div>
  );
}
