import { FREE_SHIPPING_MINIMUM } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

/** A sprig from the logo's wreath, one weight, no fill. */
function Sprig({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 26 12"
      className={`h-2.5 w-[1.3rem] shrink-0 opacity-70 max-[380px]:hidden ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 10.5C8 10.5 14 8 18 2.5" />
      <path d="M18 2.5c-4-.7-6.7.9-7.4 3.8 2.9.7 5.6-.8 7.4-3.8Z" />
      <path d="M18 2.5c1.6 3.4 4.4 4.4 7.4 2.9-1.1-2.8-3.9-3.8-7.4-2.9Z" />
    </svg>
  );
}

/** Thin ribbon above the header. Sits outside the sticky nav, so it scrolls away. */
export function AnnouncementBar() {
  return (
    <p className="flex items-center justify-center gap-2 bg-gradient-to-b from-sage-700 to-sage-800 px-4 py-[0.42rem] text-center font-sans text-[0.76rem] font-bold tracking-[0.04em] text-cream-50 sm:text-[0.83rem]">
      <Sprig />
      <span>Free shipping on orders over {formatMoney(FREE_SHIPPING_MINIMUM).replace(/\.00$/, "")}</span>
      <Sprig flip />
    </p>
  );
}
