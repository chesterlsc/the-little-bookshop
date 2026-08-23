"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoHorizontal } from "./logo";
import { CartButton } from "./cart-ui";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/build", label: "Build a Shelf" },
  { href: "/about", label: "Our Story" },
  { href: "/faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="glass site-header sticky top-0 z-50">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <LogoHorizontal />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 font-display text-[0.98rem] font-semibold transition ${
                  active
                    ? "bg-sage-200 text-sage-800"
                    : "text-ink-600 hover:bg-cream-100 hover:text-ink-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden lg:block">
          <CartButton />
        </div>
        {/* mobile: keep the top bar quiet; the bottom nav does the work */}
        <Link
          href="/shop?focus=search"
          className="lg:hidden rounded-full p-2 text-ink-600 transition hover:bg-cream-100"
          aria-label="Search the shop"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" className="h-5.5 w-5.5" aria-hidden>
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="m15.5 15.5 4 4" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
