import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIES, PRODUCTS, searchProducts, type Category } from "@/lib/catalog";
import { Eyebrow, Section } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import { ProductArt } from "@/components/illustrations";
import { IconSearch } from "@/components/icons";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Every tiny thing in The Little Bookshop: shelves, six-book sets, keychains and shelf accessories.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const autofocus = sp.focus === "search";
  const results = q ? searchProducts(q) : PRODUCTS;

  return (
    <div className="pb-nav">
      <Section className="pt-8">
        <div className="mb-6 text-center">
          <Eyebrow className="mb-2">Shop all</Eyebrow>
          <h1 className="text-3xl font-bold sm:text-4xl">The whole tiny shop</h1>
          <p className="mx-auto mt-2 max-w-[52ch] font-sans text-[0.98rem] text-ink-600">
            Everything we make, on one long shelf. Filter by aisle, or search for
            something small and specific.
          </p>
        </div>

        {/* search */}
        <form action="/shop" method="get" role="search" className="mx-auto mb-5 max-w-md">
          <div className="clay-press flex items-center gap-2 rounded-full px-4 py-1.5">
            <IconSearch className="h-5 w-5 shrink-0 text-ink-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              autoFocus={autofocus}
              placeholder="Search tiny things…"
              aria-label="Search products"
              className="w-full bg-transparent py-2 font-sans text-[0.95rem] text-ink-800 placeholder:text-ink-400 focus:outline-none"
            />
            <button type="submit" className="btn btn-primary !min-h-0 !px-4 !py-1.5 text-sm">
              Search
            </button>
          </div>
        </form>

        {/* category chips */}
        <nav aria-label="Categories" className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:justify-center">
          {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
            ([slug, cat]) => (
              <Link
                key={slug}
                href={`/shop/${slug}`}
                className="shrink-0 rounded-full border-[1.5px] border-taupe-300 bg-cream-50 px-4 py-2 font-display text-[0.92rem] font-semibold text-ink-600 transition hover:border-brown-500 hover:text-ink-800"
              >
                {cat.name}
              </Link>
            ),
          )}
        </nav>

        {q && (
          <p className="mb-4 text-center font-sans text-sm text-ink-600" aria-live="polite">
            {results.length
              ? `${results.length} tiny ${results.length === 1 ? "thing" : "things"} for “${q}”`
              : null}
          </p>
        )}

        {results.length === 0 ? (
          <div className="mx-auto max-w-md py-10 text-center">
            <ProductArt kind="books-custom" title="" className="mx-auto h-36 w-36 opacity-80" />
            <h2 className="mt-4 font-display text-xl font-bold">Nothing on this shelf yet</h2>
            <p className="mt-2 font-sans text-[0.95rem] text-ink-600">
              We couldn't find anything for “{q}”. Try “shelf”, “set”, “keychain”,
              “sticker”, or tell us what you were hoping for and we might make it.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Link href="/shop" className="btn btn-quiet">
                Clear search
              </Link>
              <Link href="/contact" className="btn btn-blush">
                Suggest a tiny thing
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {results.map((p, i) => (
              <ProductCard key={p.slug} product={p} eager={i < 4} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
