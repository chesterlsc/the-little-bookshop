"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SketchScene } from "./sketch-scene";

/**
 * Entry splash: the open book sketches itself over the page when the site is
 * first opened, then the whole overlay fades away. Plays on hard loads only.
 * Internal navigations never remount the layout, so it does not replay.
 * The fade-out is pure CSS (works before hydration); JS only removes the DOM
 * afterwards and lets a click skip ahead. Reduced-motion users never see it.
 */
export function SplashScreen() {
  const pathname = usePathname();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setGone(true), 3200);
    return () => window.clearTimeout(t);
  }, []);

  // never over an order or payment screen: that page carries the customer's
  // number and the amount they owe, and it is meant to be bookmarked
  if (gone || pathname.startsWith("/order/")) return null;
  return (
    <div
      className="splash fixed inset-0 z-[90] flex items-center justify-center bg-cream-50"
      onClick={() => setGone(true)}
      aria-hidden
    >
      <div className="text-center">
        <SketchScene className="mx-auto w-60 sm:w-72" />
        <Image
          src="/brand/logo_wordmark_h.png"
          alt=""
          width={1127}
          height={120}
          priority
          className="soft-in mx-auto mt-4 h-5 w-auto sm:h-6"
          style={{ animationDelay: "1250ms" }}
        />
      </div>
    </div>
  );
}
