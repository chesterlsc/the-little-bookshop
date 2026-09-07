"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui";
import { acceptCookies, cookiesAccepted } from "@/lib/welcome";

/**
 * The cookie notice: one small glass slip, one button.
 *
 * The site sets no advertising or tracking cookies (the privacy policy says
 * so), so there is nothing to opt out of and a second "essentials only"
 * button would be fake weight. Add it the day analytics arrive.
 *
 * Not a dialog: it never takes focus, never locks scroll, and shows on every
 * route including checkout, because it is a notice rather than a promotion.
 * Independent of the welcome popup in both directions.
 */
export function CookieBar() {
  const [show, setShow] = useState(false);

  // decided after mount so server and client markup match
  useEffect(() => {
    setShow(!cookiesAccepted());
  }, []);

  if (!show) return null;

  const ok = () => {
    acceptCookies();
    setShow(false);
  };

  return (
    <aside
      aria-label="Cookies"
      className="glass animate-fade-up fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[65] rounded-[20px] px-4 py-3 lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-sm"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="flex-1 font-sans text-xs leading-snug text-ink-800 sm:text-sm">
          A few small cookies keep your basket and your little shelf saved between visits. None for
          ads.{" "}
          <Link href="/policies/privacy" className="btn-link">
            Privacy
          </Link>
        </p>
        <Button variant="quiet" onClick={ok} className="!min-h-[36px] !px-3 !py-1 text-xs">
          Okay
        </Button>
      </div>
    </aside>
  );
}
