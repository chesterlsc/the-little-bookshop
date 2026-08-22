import Image from "next/image";
import Link from "next/link";
import { ButtonLink, Eyebrow, ScallopBand, Section, Badge } from "@/components/ui";
import { FolkDivider, SketchDoodle } from "@/components/illustrations";
import { ThemeShelfDemo } from "@/components/theme-shelf-demo";
import { ProductCard } from "@/components/product-card";
import { CATEGORIES, getProduct, type Category } from "@/lib/catalog";
import { FAQ } from "@/content/site";
import { IconArrowRight, IconCheck } from "@/components/icons";

const FEATURED = [
  "mini-scalloped-bookshelf",
  "custom-mini-book-set",
  "mini-book-keychain",
  "mini-plants",
  "mini-twilight-saga-set",
  "mini-arched-bookshelf",
  "bookstore-acrylic-keychain",
  "emily-henry-book-stack-sticker",
];

export default function HomePage() {
  return (
    <div className="pb-nav">
      {/* ─── Hero ─── */}
      <Section tint="paper" className="scallop-bottom relative overflow-hidden" >
        <div className="grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-20">
          <div className="animate-fade-up text-center lg:text-left">
            <Eyebrow className="mb-3">Miniatures for book lovers</Eyebrow>
            <h1 className="font-display text-[2.35rem] font-bold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
              A tiny shelf for the stories that{" "}
              <span className="relative inline-block text-rose-600">
                made you
                <svg viewBox="0 0 120 12" className="absolute -bottom-1 left-0 w-full" aria-hidden>
                  <path d="M4 8 Q 30 2 60 7 T 116 6" fill="none" stroke="var(--color-sage-500)" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              .
            </h1>
            <p className="mx-auto mt-4 max-w-[46ch] font-sans text-[1.05rem] leading-relaxed text-ink-600 lg:mx-0">
              Handmade mini bookshelves in ten colors, and miniature books in sets
              of six. Ready-made series, or your own titles, covers and all.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
              <ButtonLink href="/build" className="!px-7 !py-3.5 text-lg">
                Build your little shelf
              </ButtonLink>
              <ButtonLink href="/shop" variant="quiet" className="!px-6 !py-3.5 text-lg">
                Shop the collection
              </ButtonLink>
            </div>
            <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 font-sans text-[0.82rem] font-bold text-ink-600 lg:justify-start">
              {["Handmade to order", "Books come in sets of six", "Arrives in an illustrated box"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <IconCheck className="h-4 w-4 text-sage-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-up relative mx-auto w-full max-w-md lg:max-w-none" style={{ animationDelay: "120ms" }}>
            <div className="stitch rotate-[-1.5deg] overflow-hidden bg-cream-50 p-2 shadow-[0_24px_30px_rgba(94,73,52,0.18)]">
              <Image
                src="/products/custom-mini-book-set/08.webp"
                alt="A blush arched mini bookshelf filled with handmade miniature books and a tiny plant"
                width={1200}
                height={1200}
                priority
                sizes="(min-width:1024px) 46vw, 92vw"
                className="aspect-square w-full rounded-2xl object-cover"
              />
            </div>
            <div className="stitch absolute -bottom-6 -left-4 w-32 rotate-[5deg] overflow-hidden bg-cream-50 p-1.5 shadow-[0_14px_20px_rgba(94,73,52,0.2)] sm:w-40 lg:-left-8">
              <Image
                src="/products/custom-mini-book-set/01.webp"
                alt="Three custom miniature books held in a hand"
                width={480}
                height={480}
                sizes="160px"
                className="aspect-square w-full rounded-xl object-cover"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Categories ─── */}
      <Section className="pt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <Eyebrow className="mb-2">Around the shop</Eyebrow>
            <h2 className="text-2xl font-bold sm:text-3xl">Little things, by aisle</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-1 font-display font-semibold text-sage-700 hover:underline sm:inline-flex">
            Shop all <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(([slug, cat], i) => (
            <Link
              key={slug}
              href={`/shop/${slug}`}
              className="clay clay-hover group animate-fade-up relative flex min-w-[46%] snap-start flex-col text-center sm:min-w-0"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {/* a little drawing that sketches itself, like a shop sign being painted */}
              <span className="absolute -right-2 -top-2 z-10 flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-taupe-200/80 bg-cream-50 shadow-clay-sm transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                <SketchDoodle kind={slug} delay={i * 700} className="h-8 w-8" />
              </span>
              <div className="relative m-2.5 mb-0 aspect-[4/3] overflow-hidden rounded-2xl border-[1.5px] border-taupe-200/70 bg-paper">
                <Image
                  src={cat.photo}
                  alt={cat.name}
                  fill
                  sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 46vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3.5 pt-2.5">
                <span className="font-display text-[1.02rem] font-semibold leading-tight">{cat.name}</span>
                <span className="font-sans text-xs leading-snug text-ink-600">{cat.blurb}</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ─── Build your little shelf ─── */}
      <div className="mt-14">
        <ScallopBand from="sage" />
        <Section tint="sage" className="pb-12 pt-8">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <Eyebrow className="mb-2">The signature</Eyebrow>
            <h2 className="text-3xl font-bold sm:text-4xl">Build your little shelf</h2>
            <p className="story-line mt-3 text-lg text-ink-600">
              Pick a theme, choose six stories, and watch your shelf fill up.
            </p>
          </div>
          <ThemeShelfDemo />
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Choose a shelf", "Six styles, ten studio colors, two sizes."],
              ["2", "Pick six stories", "A ready-made set, or your own six titles."],
              ["3", "Make it yours", "Add tiny extras, a theme, and a note."],
            ].map(([n, title, body]) => (
              <div key={n} className="clay flex items-start gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush-200 font-display text-lg font-bold text-rose-700 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.7)]">
                  {n}
                </span>
                <div>
                  <p className="font-display font-semibold">{title}</p>
                  <p className="font-sans text-sm text-ink-600">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href="/build" className="!px-8 !py-3.5 text-lg">
              Start building <IconArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>
        </Section>
        <div className="rotate-180">
          <ScallopBand from="sage" />
        </div>
      </div>

      {/* ─── Set of six ─── */}
      <Section className="pt-14">
        <div className="clay overflow-hidden">
          <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto]">
            <Image
              src="/products/custom-mini-book-set/03.webp"
              alt="A miniature book held up in front of the full-size edition it was made from"
              width={640}
              height={640}
              sizes="200px"
              className="mx-auto aspect-square w-40 rounded-2xl object-cover"
            />
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold sm:text-3xl">Miniature books come in sets of six</h2>
              <p className="mx-auto mt-2 max-w-[58ch] font-sans text-[0.98rem] leading-relaxed text-ink-600 lg:mx-0">
                Six is what fits the backing card, and about as many favorites as
                anyone can name without hedging. Pick a ready-made series, or send us
                your own six titles. We source each cover, scale it down, print it on
                matte cardstock and mount it by hand.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                <Badge tone="rose">Always six</Badge>
                <Badge tone="sage">About 1 × 1.4 in each</Badge>
                <Badge tone="taupe">Made to order</Badge>
              </div>
            </div>
            <div className="flex flex-row justify-center gap-2 lg:flex-col">
              <ButtonLink href="/products/custom-mini-book-set" variant="blush">
                Customize a set
              </ButtonLink>
              <ButtonLink href="/shop/mini-books" variant="quiet">
                Ready-made sets
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Featured ─── */}
      <Section className="pt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <Eyebrow className="mb-2">Fresh from the studio</Eyebrow>
            <h2 className="text-2xl font-bold sm:text-3xl">Little things to start with</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-1 font-display font-semibold text-sage-700 hover:underline sm:inline-flex">
            See everything <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {FEATURED.map((slug, i) => {
            const p = getProduct(slug);
            return p ? <ProductCard key={slug} product={p} eager={i < 2} /> : null;
          })}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <ButtonLink href="/shop" variant="quiet">
            See everything
          </ButtonLink>
        </div>
      </Section>

      {/* ─── Packaging & story ─── */}
      <div className="mt-14">
        <ScallopBand from="blush" />
        <Section tint="blush" className="pb-14 pt-8">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="order-2 grid grid-cols-2 gap-3 lg:order-1">
              <div className="stitch rotate-[-1.5deg] overflow-hidden bg-cream-50 p-2">
                <Image
                  src="/brand/pack_box_angle.png"
                  alt="Illustrated Little Bookshop gift box, seen from an angle"
                  width={444}
                  height={505}
                  className="h-full w-full rounded-2xl object-cover"
                />
              </div>
              <div className="stitch mt-6 rotate-[1.5deg] overflow-hidden bg-cream-50 p-2">
                <Image
                  src="/brand/photo_box.jpg"
                  alt="The real Little Bookshop box, photographed in the studio"
                  width={1430}
                  height={1120}
                  className="h-full w-full rounded-2xl object-cover"
                />
              </div>
              <p className="col-span-2 text-center font-sans text-xs text-ink-600">
                Left: the illustrated box design. Right: the real thing, fresh from the studio.
              </p>
            </div>
            <div className="order-1 text-center lg:order-2 lg:text-left">
              <Eyebrow className="mb-2">Unboxing, but tiny</Eyebrow>
              <h2 className="text-3xl font-bold">Wrapped like it matters</h2>
              <p className="mt-3 font-sans text-[0.98rem] leading-relaxed text-ink-600">
                Shelf-and-book bundles arrive in our illustrated bookshelf box. Book
                sets come tucked into a six-slot backing card, one window per story.
                Keychains hang from their own illustrated card.
              </p>
              <p className="story-line mt-4 text-lg text-ink-600">
                Which makes it a dangerously easy gift.
              </p>
              <div className="mt-5 flex justify-center gap-2 lg:justify-start">
                <ButtonLink href="/about" variant="quiet">
                  Our story
                </ButtonLink>
                <ButtonLink href="/shop/mini-books" variant="blush">
                  Gift a set of six
                </ButtonLink>
              </div>
            </div>
          </div>
        </Section>
        <div className="rotate-180">
          <ScallopBand from="blush" />
        </div>
      </div>

      {/* ─── FAQ teaser ─── */}
      <Section className="pt-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <Eyebrow className="mb-2">Small questions</Eyebrow>
            <h2 className="text-2xl font-bold sm:text-3xl">Asked often, answered gladly</h2>
          </div>
          <div className="space-y-3">
            {FAQ.slice(0, 3).map((item) => (
              <details key={item.q} className="clay group px-5 py-4 open:pb-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-[1.02rem] font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="text-xl text-taupe-500 transition-transform duration-300 group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 font-sans text-[0.95rem] leading-relaxed text-ink-600">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-5 text-center">
            <Link href="/faq" className="inline-flex items-center gap-1 font-display font-semibold text-sage-700 hover:underline">
              All questions <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <FolkDivider className="mx-auto mt-10 h-6 w-56 opacity-80" />
        </div>
      </Section>
    </div>
  );
}
