import { redirect } from "next/navigation";
import { getOrder, parseSnapshot } from "@/lib/orders";
import { PayScreen } from "@/components/pay-screen";
import { toPaySnapshot } from "@/lib/pay-snapshot";

export const metadata = { title: "Complete your payment", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PayPage({ params }: PageProps<"/order/[number]/pay">) {
  const { number } = await params;
  const orderNumber = decodeURIComponent(number);

  // The order store is the source of truth, but it must never be the reason a
  // customer who has just paid cannot see what they owe: if the lookup fails or
  // finds nothing, PayScreen falls back to the copy kept by the tab that placed
  // the order.
  let initial = null;
  try {
    const order = await getOrder(orderNumber);
    if (order) {
      // only an unpaid order may be asked for money; every other status is
      // already described correctly by the status page
      if (order.status !== "awaiting_payment") redirect(`/order/${order.number}`);
      initial = toPaySnapshot(order.number, parseSnapshot(order));
    }
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err; // redirect()
    console.error(`[order ${orderNumber}] lookup failed, using the customer's copy:`, err);
  }

  return (
    <div className="pb-nav">
      <PayScreen orderNumber={orderNumber} initial={initial} />
    </div>
  );
}
