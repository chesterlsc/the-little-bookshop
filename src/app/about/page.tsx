import Image from "next/image";
import type { Metadata } from "next";
import { ButtonLink, Eyebrow, ScallopBand, Section } from "@/components/ui";
import { FolkDivider, MiniShelf } from "@/components/illustrations";
import { LogoFull } from "@/components/logo";
import { ABOUT } from "@/content/site";

export const metadata: Metadata = {
  title: "Our story",
  description: "Why The Little Bookshop makes tiny shelves, six-book sets, and other miniatures for book lovers.",
};

export default function AboutPage() {
  return (
    <div className="pb-nav">
      <Section tint="paper">
        <div className="mx-auto max-w-2xl py-12 text-center">
          <LogoFull className="mx-auto w-52" priority />
          <Eyebrow className="mt-6">Our story</Eyebrow>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            A whole reading life, two hands wide
          </h1>
        </div>
      </Section>

      <Section className="pt-10">
        <div className="mx-auto max-w-2xl space-y-4">
          {ABOUT.intro.map((p, i) => (
            <p key={i} className="font-sans text-[1.05rem] leading-relaxed text-ink-600">
              {p}
            </p>
          ))}
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl items-center gap-6 sm:grid-cols-2">
          <div className="stitch rotate-[-1.2deg] bg-cream-50 p-2">
            <Image
              src="/marketing/packaging/08.webp"
              alt="Miniature paperbacks on a working desk, one propped open, a stack topped with Happy Place"
              width={1050}
              height={1400}
              className="w-full rounded-2xl object-cover"
            />
          </div>
          <div className="space-y-4">
            <div className="stitch rotate-[1.2deg] bg-cream-50 p-2">
              <Image
                src="/brand/pack_sticker_tag.png"
                alt="The Little Bookshop sticker and thank-you tag"
                width={525}
                height={410}
                className="w-full rounded-2xl object-cover"
              />
            </div>
            <p className="text-center font-sans text-xs text-ink-600">
              Fresh prints, hand-packed parcels, and a thank-you on every box.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <FolkDivider className="mx-auto mb-6 h-6 w-52 opacity-80" />
          <h2 className="text-center text-2xl font-bold">Why six?</h2>
          <div className="mt-4 space-y-4">
            {ABOUT.why.map((p, i) => (
              <p key={i} className="font-sans text-[1.05rem] leading-relaxed text-ink-600">
                {p}
              </p>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-sm">
            <MiniShelf
              titles={["The One", "That Got", "You Through", "The Year", "You Needed", "It Most"]}
              className="w-full"
            />
          </div>
        </div>
      </Section>
      <ScallopBand from="paper" to="cream" />

      <ScallopBand from="sage" to="cream" rise />
      <Section tint="sage" className="py-10 lg:py-14">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { photo: "/products/custom-mini-book-set/04.webp", title: "Made to order", body: "Every set is printed, mounted and packed after you order it. Nothing sits in a warehouse." },
              { photo: "/products/mini-scalloped-bookshelf/03.webp", title: "Nine studio colors", body: "Shelves come in nine colors we actually like, in plant-based PLA with a soft matte finish." },
              { photo: "/products/mini-book-keychain/01.webp", title: "Gift-ready", body: "Illustrated boxes, six-slot cards and hanging cards. Packaging that's part of the present." },
            ].map((c) => (
              <div key={c.title} className="clay p-5 text-center">
                <Image
                  src={c.photo}
                  alt=""
                  width={384}
                  height={384}
                  sizes="96px"
                  className="mx-auto h-24 w-24 rounded-2xl object-cover"
                />
                <h3 className="mt-2 font-display text-lg font-bold">{c.title}</h3>
                <p className="mt-1 font-sans text-sm leading-relaxed text-ink-600">{c.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href="/build" className="!px-8 !py-3.5 text-lg">
              Build your little shelf
            </ButtonLink>
            <p className="story-line mt-3 text-ink-600">
              Or just come browse the aisles. The bell above the door is imaginary, but it rings.
            </p>
          </div>
      </Section>
      <ScallopBand from="sage" to="cream" />
    </div>
  );
}
