import type { Metadata } from "next";
import { Eyebrow, Section } from "@/components/ui";
import { ShelfBuilder } from "@/components/shelf-builder";

export const metadata: Metadata = {
  title: "Build your little shelf",
  description:
    "Choose a mini bookshelf, pick or customize a set of six miniature books, add tiny extras, and bring home a shelf of the stories that made you.",
};

export default function BuildPage() {
  return (
    <div className="pb-nav">
      <Section className="pt-8">
        <div className="mb-6 text-center">
          <Eyebrow className="mb-2">The signature</Eyebrow>
          <h1 className="text-3xl font-bold sm:text-4xl">Build your little shelf</h1>
          <p className="mx-auto mt-2 max-w-[52ch] font-sans text-[0.98rem] text-ink-600">
            A shelf, six stories, and the small details that make it yours. Your progress
            saves itself, so wander off and come back any time.
          </p>
        </div>
        <ShelfBuilder />
      </Section>
    </div>
  );
}
