import { notFound } from "next/navigation";
import { MiniShelf, type ShelfShape } from "@/components/illustrations";

const SHAPES: ShelfShape[] = ["scalloped", "basic", "fancy", "cube", "arched", "medieval"];
const TITLES = ["The Summer I Turned Pretty", "Fourth Wing", "It Ends With Us", "Beach Read", "The Housemaid", "Onyx Storm"];
const COLORS = ["#f2b5a0", "#a9c6e0", "#b5c9a3", "#f5f2ec", "#5d4636", "#b9a8d1"];

/** Dev-only gallery of every shelf sketch: 6 shapes × 2 sizes × filled/empty. */
export default function ShelfGallery() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      {(["regular", "miniature"] as const).map((size) => (
        <section key={size}>
          <h2 className="mb-3 font-display text-xl font-bold">{size}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {SHAPES.map((shape, i) => (
              <div key={shape} className="clay p-3">
                <p className="mb-1 text-center font-sans text-xs font-bold">{shape}</p>
                <MiniShelf shape={shape} size={size} titles={TITLES} shelfColor={COLORS[i]} accent={false} className="w-full" />
              </div>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h2 className="mb-3 font-display text-xl font-bold">half-filled + empty</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {SHAPES.slice(0, 3).map((shape, i) => (
            <div key={shape} className="clay p-3">
              <MiniShelf shape={shape} size="regular" titles={TITLES.slice(0, 3)} shelfColor={COLORS[i]} accent={false} className="w-full" />
            </div>
          ))}
          {SHAPES.slice(3).map((shape, i) => (
            <div key={shape} className="clay p-3">
              <MiniShelf shape={shape} size="miniature" titles={[]} shelfColor={COLORS[i + 3]} accent={false} className="w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
