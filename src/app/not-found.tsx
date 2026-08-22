import { ButtonLink, Section } from "@/components/ui";
import { MiniShelf } from "@/components/illustrations";

export default function NotFound() {
  return (
    <Section className="pb-nav pt-14">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto max-w-xs opacity-90">
          <MiniShelf titles={["Lost?", "", "This", "Page", "", "Wandered"]} className="w-full" label="A shelf with missing books" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold">This shelf is empty</h1>
        <p className="mx-auto mt-2 max-w-[40ch] font-sans text-[0.98rem] text-ink-600">
          The page you were after isn't here. Maybe it was tiny and we misplaced it.
          The rest of the shop is exactly where it should be.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/">Back home</ButtonLink>
          <ButtonLink href="/shop" variant="quiet">
            Browse the shop
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
