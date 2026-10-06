import { promoLive } from "@/lib/promo";
import { RibbonTicker } from "./ribbon-ticker";

/**
 * Thin ribbon above the header. Sits outside the sticky nav, so it scrolls away.
 *
 * Drawn rather than printed: the sprigs ink themselves in on load, the way the
 * rest of the site's line art does, and a slow highlight passes over the number
 * once so the eye lands on the figure that decides the basket. Both stop for
 * anyone who asked for less motion, and the text alone still reads perfectly.
 */
function Sprig({ flip = false, delay = 0 }: { flip?: boolean; delay?: number }) {
  return (
    <svg
      viewBox="0 0 26 12"
      className={`h-3 w-[1.6rem] shrink-0 opacity-80 max-[400px]:hidden ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 10.5C8 10.5 14 8 18 2.5" pathLength={300} className="sketch-once" style={{ animationDelay: `${delay}ms` }} />
      <path
        d="M18 2.5c-4-.7-6.7.9-7.4 3.8 2.9.7 5.6-.8 7.4-3.8Z"
        pathLength={300}
        className="sketch-once"
        style={{ animationDelay: `${delay + 180}ms` }}
      />
      <path
        d="M18 2.5c1.6 3.4 4.4 4.4 7.4 2.9-1.1-2.8-3.9-3.8-7.4-2.9Z"
        pathLength={300}
        className="sketch-once"
        style={{ animationDelay: `${delay + 300}ms` }}
      />
    </svg>
  );
}

export function AnnouncementBar() {
  return (
    <div
      role="region"
      aria-label="Shop news"
      className="announcement isolate flex items-center justify-center gap-2.5 overflow-hidden pl-4 pr-10 text-center font-display text-[0.9rem] font-bold leading-none tracking-[0.02em] text-cream-50 sm:text-[1rem]"
    >
      <Sprig delay={240} />
      {/* free shipping, and while a promo runs its code and its days, taking turns */}
      <RibbonTicker initialLive={promoLive()} />
      <Sprig flip delay={420} />
    </div>
  );
}
