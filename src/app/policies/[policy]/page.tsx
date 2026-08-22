import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POLICIES } from "@/content/site";
import { Eyebrow, Section } from "@/components/ui";
import { FolkDivider } from "@/components/illustrations";

export function generateStaticParams() {
  return Object.keys(POLICIES).map((policy) => ({ policy }));
}

export async function generateMetadata({
  params,
}: PageProps<"/policies/[policy]">): Promise<Metadata> {
  const { policy } = await params;
  const doc = POLICIES[policy];
  if (!doc) return {};
  return { title: doc.title };
}

export default async function PolicyPage({ params }: PageProps<"/policies/[policy]">) {
  const { policy } = await params;
  const doc = POLICIES[policy];
  if (!doc) notFound();

  return (
    <div className="pb-nav">
      <Section className="pt-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-7 text-center">
            <Eyebrow className="mb-2">The small print (appropriately small)</Eyebrow>
            <h1 className="text-3xl font-bold sm:text-4xl">{doc.title}</h1>
            <p className="mt-2 font-sans text-xs text-ink-400">Last updated: {doc.updated}</p>
          </div>
          <div className="clay space-y-4 p-6 sm:p-7">
            {doc.body.map((p, i) => (
              <p key={i} className="font-sans text-[0.98rem] leading-relaxed text-ink-600">
                {p}
              </p>
            ))}
          </div>
          <p className="mt-4 text-center font-sans text-xs text-ink-400">
            Text in ⟨angle brackets⟩ is a placeholder awaiting the shop's confirmed details.
          </p>
          <FolkDivider className="mx-auto mt-8 h-6 w-52 opacity-80" />
        </div>
      </Section>
    </div>
  );
}
