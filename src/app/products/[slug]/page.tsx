import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PRODUCTS, getProduct, CATEGORIES } from "@/lib/catalog";
import { Badge, Eyebrow, Section } from "@/components/ui";
import { ProductArt, FolkDivider } from "@/components/illustrations";
import { ProductConfigurator } from "@/components/product-configurator";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return { title: product.name, description: product.blurb };
}

const DETAIL_SECTIONS: {
  key: keyof NonNullable<ReturnType<typeof getProduct>>["details"] | "included";
  label: string;
}[] = [
  { key: "included", label: "What's included" },
  { key: "packaging", label: "Packaging" },
  { key: "dimensions", label: "Size & fit" },
  { key: "materials", label: "Materials" },
  { key: "care", label: "Care" },
  { key: "shipping", label: "Made-to-order & shipping" },
];

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = CATEGORIES[product.category];
  const related = product.related
    .map((s) => getProduct(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 3);

  return (
    <div className="pb-nav">
      <Section className="pt-5">
        <nav aria-label="Breadcrumb" className="mb-4 font-sans text-sm text-ink-600">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href={`/shop/${product.category}`} className="hover:underline">
                {category.name}
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="font-bold text-ink-800">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* gallery */}
          {product.images.length > 0 ? (
            <ProductGallery
              images={product.images}
              name={product.name}
              soldOut={!product.available}
            />
          ) : (
            <div className="clay relative flex aspect-square items-center justify-center overflow-hidden p-2">
              <ProductArt kind={product.art} title={product.name} className="h-[78%] w-[78%]" />
            </div>
          )}

          {/* info + configurator */}
          <div>
            <Eyebrow className="mb-1.5">{category.name}</Eyebrow>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.setOfSix && <Badge tone="rose">Sold as a set of six</Badge>}
              {(product.badges ?? [])
                .filter((b) => b !== "Set of six")
                .map((b) => (
                  <Badge key={b} tone="sage">
                    {b}
                  </Badge>
                ))}
            </div>
            <p className="mt-3 font-sans text-[1.02rem] leading-relaxed text-ink-600">
              {product.blurb}
            </p>

            <div className="mt-5">
              <ProductConfigurator product={product} />
            </div>

            {/* included titles for ready-made sets */}
            {product.setOfSix && !product.customSet && (
              <div className="stitch mt-6 bg-paper p-4">
                <p className="font-display font-bold">The six inside</p>
                {product.includedTitles ? (
                  <ol className="mt-2 grid list-decimal gap-1 pl-5 font-sans text-[0.95rem] text-ink-600 sm:grid-cols-2">
                    {product.includedTitles.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-1.5 font-sans text-sm text-ink-600">
                    Six covers from this series. The exact six are listed with your
                    order confirmation.
                  </p>
                )}
              </div>
            )}

            {/* details accordion */}
            <div className="mt-6 space-y-2">
              {DETAIL_SECTIONS.map(({ key, label }) => {
                const value = product.details[key as keyof typeof product.details];
                if (!value) return null;
                return (
                  <details key={key} className="clay-sm group px-4 py-3" open={key === "included"}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-[0.98rem] font-semibold [&::-webkit-details-marker]:hidden">
                      {label}
                      <span className="text-lg text-taupe-500 transition-transform duration-300 group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </summary>
                    <div className="mt-1.5 font-sans text-[0.9rem] leading-relaxed text-ink-600">
                      {Array.isArray(value) ? (
                        <ul className="list-disc space-y-1 pl-4">
                          {value.map((v) => (
                            <li key={v}>{v}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{value}</p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </div>

        {/* description */}
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <FolkDivider className="mx-auto mb-6 h-6 w-52 opacity-80" />
          {product.description.map((p, i) => (
            <p key={i} className="mb-3 font-sans text-[1.02rem] leading-relaxed text-ink-600">
              {p}
            </p>
          ))}
        </div>

        {/* related */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-5 text-2xl font-bold">Often shelved together</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
