import Link from "next/link";
import { LogoFull } from "./logo";
import { ScallopBand } from "./ui";
import { FolkDivider } from "./illustrations";
import { CATEGORIES } from "@/lib/catalog";
import { SITE } from "@/content/site";

const SHOP_LINKS = Object.entries(CATEGORIES).map(([slug, c]) => ({
  href: `/shop/${slug}`,
  label: c.name,
}));

const HELP_LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/returns", label: "Returns & exchanges" },
];

const ABOUT_LINKS = [
  { href: "/about", label: "Our story" },
  { href: "/build", label: "Build your little shelf" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="bg-cream-100 pb-nav">
      <ScallopBand from="cream" to="cream100" />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <LogoFull className="w-40" />
            <p className="story-line mt-4 max-w-[30ch] text-[0.95rem] text-ink-600">
              Tiny shelves for the stories that made you, made slowly and by hand.
            </p>
          </div>
          <nav aria-label="Shop">
            <p className="eyebrow mb-3">Shop</p>
            <ul className="space-y-2">
              {SHOP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-sans text-[0.95rem] text-ink-600 transition hover:text-ink-800 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Help">
            <p className="eyebrow mb-3">Help</p>
            <ul className="space-y-2">
              {HELP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-sans text-[0.95rem] text-ink-600 transition hover:text-ink-800 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="About" className="col-span-2 sm:col-span-1">
            <p className="eyebrow mb-3">The shop</p>
            <ul className="space-y-2">
              {ABOUT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-sans text-[0.95rem] text-ink-600 transition hover:text-ink-800 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <FolkDivider className="mx-auto mt-10 h-6 w-56 opacity-80" />
        <p className="mt-4 text-center font-sans text-xs text-ink-400">
          © {new Date().getFullYear()} {SITE.businessName}. Miniatures for book lovers. All tiny rights reserved.
        </p>
      </div>
    </footer>
  );
}
