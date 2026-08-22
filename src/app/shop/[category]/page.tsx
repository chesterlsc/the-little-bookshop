import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CATEGORIES,
  productsInCategory,
  type Category,
} from "@/lib/catalog";
import { Badge, ButtonLink, Eyebrow, Section } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import Image from "next/image";

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES[category as Category];
  if (!cat) return {};
  return { title: cat.name, description: cat.blurb };
}

export default async function CategoryPage({ params }: PageProps<"/shop/[category]">) {
  const { category } = await params;
  const cat = CATEGORIES[category as Category];
  if (!cat) notFound();
  const products = productsInCategory(category as Category);
  const others = (Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).filter(
    ([slug]) => slug !== category,
  );

  return (
    <div className="pb-nav">
      <Section className="pt-8">
        <nav aria-label="Breadcrumb" className="mb-4 font-sans text-sm text-ink-600">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="font-bold text-ink-800">
              {cat.name}
            </li>
          </ol>
        </nav>

        <div className="clay mb-8 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <Image
            src={cat.photo}
            alt={cat.name}
            width={448}
            height={448}
            sizes="112px"
            className="h-28 w-28 shrink-0 rounded-2xl object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold">{cat.name}</h1>
            <p className="mt-1 font-sans text-[0.98rem] text-ink-600">{cat.blurb}</p>
            {category === "mini-books" && (
              <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <Badge tone="rose">Always sold as a set of six</Badge>
                <Badge tone="sage">Custom sets welcome</Badge>
              </div>
            )}
            {category === "accessories" && (
              <p className="mt-2 font-sans text-sm text-ink-600">
                These little extras can also be added to any{" "}
                <Link href="/build" className="font-bold text-sage-700 underline">
                  shelf bundle
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-10 text-center">
            <h2 className="font-display text-xl font-bold">This aisle is being restocked</h2>
            <p className="mt-2 font-sans text-ink-600">Check back soon. Tiny things take time.</p>
            <ButtonLink href="/shop" variant="quiet" className="mt-4">
              Back to the shop
            </ButtonLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.slug} product={p} eager={i < 4} />
            ))}
          </div>
        )}

        <div className="mt-12">
          <Eyebrow className="mb-3 text-center">Other aisles</Eyebrow>
          <div className="flex flex-wrap justify-center gap-2">
            {others.map(([slug, c]) => (
              <Link
                key={slug}
                href={`/shop/${slug}`}
                className="rounded-full border-[1.5px] border-taupe-300 bg-cream-50 px-4 py-2 font-display text-[0.92rem] font-semibold text-ink-600 transition hover:border-brown-500 hover:text-ink-800"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
