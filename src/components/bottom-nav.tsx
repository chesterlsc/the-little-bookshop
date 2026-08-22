"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./cart-context";
import { cartCount } from "@/lib/cart";
import { IconHome, IconShop, IconShelfPlus, IconMore, IconBasket, IconX, IconSearch } from "./icons";
import { useRouter } from "next/navigation";

const LEFT = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/shop", label: "Shop", icon: IconShop },
] as const;

const RIGHT = [{ href: "/build", label: "Build", icon: IconShelfPlus }] as const;

const MORE_LINKS = [
  { href: "/about", label: "Our Story" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/returns", label: "Returns & Exchanges" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
] as const;

function Tab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof IconHome;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-14 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition ${
        active ? "text-sage-800" : "text-ink-400 hover:text-ink-600"
      }`}
    >
      <span className={`rounded-full px-3 py-0.5 transition ${active ? "bg-sage-200" : ""}`}>
        <Icon className="h-5.5 w-5.5" />
      </span>
      <span className="font-sans text-[0.66rem] font-bold tracking-wide">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, openDrawer, addPulse, ready } = useCart();
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState("");
  const count = cartCount(cart);

  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <>
      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="More pages">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink-900/30 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
          />
          <div className="glass absolute inset-x-3 bottom-[calc(104px+env(safe-area-inset-bottom))] animate-fade-up rounded-3xl p-5" style={{ animationDuration: "0.25s" }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg font-bold">More from the shop</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="clay-sm flex h-8 w-8 items-center justify-center rounded-full text-ink-600"
                aria-label="Close menu"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
            <form
              className="clay-press mb-3 flex items-center gap-2 rounded-full px-4 py-2"
              onSubmit={(e) => {
                e.preventDefault();
                setMoreOpen(false);
                router.push(`/shop?q=${encodeURIComponent(query)}`);
              }}
            >
              <IconSearch className="h-4.5 w-4.5 shrink-0 text-ink-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tiny things…"
                aria-label="Search the shop"
                className="w-full bg-transparent font-sans text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none"
              />
            </form>
            <nav aria-label="More pages" className="grid grid-cols-2 gap-1.5">
              {MORE_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-2xl bg-cream-100/70 px-4 py-2.5 font-display text-[0.95rem] font-semibold text-ink-800 transition hover:bg-cream-200"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        aria-label="Primary"
        className="glass fixed inset-x-3 bottom-3 z-[70] rounded-[28px] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="relative flex items-end justify-between px-3 py-2">
          <div className="flex flex-1 items-center justify-evenly">
            {LEFT.map((t) => (
              <Tab key={t.href} {...t} active={pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href))} />
            ))}
          </div>

          {/* raised cart */}
          <div className="relative -top-6 flex w-20 justify-center">
            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Open basket, ${count} ${count === 1 ? "item" : "items"}`}
              className="relative flex h-[64px] w-[64px] items-center justify-center rounded-full border border-sage-800 bg-gradient-to-b from-sage-500 to-sage-700 text-cream-50 shadow-[0_3px_0_var(--color-sage-800),0_14px_22px_-8px_rgba(74,85,57,0.6),inset_0_2px_0_rgba(255,255,255,0.3)] transition active:translate-y-0.5"
            >
              <IconBasket className="h-7 w-7" />
              {ready && count > 0 && (
                <span
                  key={addPulse}
                  className="absolute -right-1 -top-1 flex h-6 min-w-6 animate-pop items-center justify-center rounded-full border-2 border-cream-50 bg-rose-500 px-1 font-sans text-xs font-black text-cream-50"
                  aria-hidden
                >
                  {count}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-1 items-center justify-evenly">
            {RIGHT.map((t) => (
              <Tab key={t.href} {...t} active={pathname.startsWith(t.href)} />
            ))}
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={`flex min-w-14 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition ${
                moreOpen ? "text-sage-800" : "text-ink-400 hover:text-ink-600"
              }`}
            >
              <span className={`rounded-full px-3 py-0.5 ${moreOpen ? "bg-sage-200" : ""}`}>
                <IconMore className="h-5.5 w-5.5" />
              </span>
              <span className="font-sans text-[0.66rem] font-bold tracking-wide">More</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
