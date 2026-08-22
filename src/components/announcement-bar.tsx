import { FREE_SHIPPING_MINIMUM } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

/** Thin strip above the header. Sits outside the sticky nav, so it scrolls away. */
export function AnnouncementBar() {
  return (
    <p className="bg-sage-700 px-4 py-2 text-center font-sans text-[0.78rem] font-bold tracking-wide text-cream-50 sm:text-[0.85rem]">
      Free shipping on orders over {formatMoney(FREE_SHIPPING_MINIMUM).replace(/\.00$/, "")}
    </p>
  );
}
