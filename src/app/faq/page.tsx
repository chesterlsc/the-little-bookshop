import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, Section } from "@/components/ui";
import { FolkDivider } from "@/components/illustrations";
import { FAQ } from "@/content/site";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Sets of six, sizes, materials, shipping and other small questions, answered.",
};

export default function FaqPage() {
  return (
    <div className="pb-nav">
      <Section className="pt-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-7 text-center">
            <Eyebrow className="mb-2">Small questions</Eyebrow>
            <h1 className="text-3xl font-bold sm:text-4xl">Frequently asked questions</h1>
            <p className="mx-auto mt-2 max-w-[48ch] font-sans text-[0.95rem] text-ink-600">
              Everything people usually wonder about very small books. Missing something?{" "}
              <Link href="/contact" className="font-bold text-sage-700 underline">
                Ask us directly
              </Link>
              .
            </p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="clay group px-5 py-4 open:pb-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-[1.05rem] font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="text-xl text-taupe-500 transition-transform duration-300 group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 font-sans text-[0.95rem] leading-relaxed text-ink-600">{item.a}</p>
              </details>
            ))}
          </div>
          <FolkDivider className="mx-auto mt-10 h-6 w-52 opacity-80" />
        </div>
      </Section>
    </div>
  );
}
