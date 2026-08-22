"use client";

import { useState } from "react";
import Link from "next/link";
import { MiniShelf } from "./illustrations";
import { SHELF_THEMES, type ShelfThemeId } from "@/lib/catalog";

const DEMO_TITLES: Record<ShelfThemeId, string[]> = {
  tbr: ["Someday Soon", "The Big One", "Book Two", "A Classic", "The Hype", "Tiny Poems"],
  "five-star": ["The Favorite", "Cried At This", "Five Stars", "Perfect Ending", "Reread ×3", "The Comfort"],
  finished: ["January", "February", "March", "April", "May", "June"],
  favorites: ["Childhood", "The Gift", "First Love", "The Escape", "Old Friend", "New Friend"],
  series: ["Book One", "Book Two", "Book Three", "The Novella", "Book Four", "The Finale"],
  comfort: ["Rainy Day", "Cocoa Read", "The Cozy One", "Small Town", "The Bakery", "Happy End"],
  kindle: ["KU Gem", "3am Chapter", "The Binge", "Beach Read", "BookTok Pick", "Hidden Gem"],
  custom: ["You", "Choose", "All", "Six", "Tiny", "Stories"],
};

export function ThemeShelfDemo() {
  const [themeId, setThemeId] = useState<ShelfThemeId>("five-star");
  const theme = SHELF_THEMES.find((t) => t.id === themeId)!;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="order-2 lg:order-1">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pick a shelf theme to preview">
          {SHELF_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setThemeId(t.id)}
              aria-pressed={t.id === themeId}
              className={`rounded-full border-[1.5px] px-3.5 py-1.5 font-display text-[0.9rem] font-semibold transition ${
                t.id === themeId
                  ? "border-sage-800 bg-sage-600 text-cream-50 shadow-[0_2px_0_var(--color-sage-800)]"
                  : "border-taupe-300 bg-cream-50 text-ink-600 hover:border-brown-500 hover:text-ink-800"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <p className="story-line mt-4 text-lg text-ink-600" aria-live="polite">
          “{theme.line}”
        </p>
      </div>
      <div className="order-1 mx-auto w-full max-w-sm lg:order-2">
        <MiniShelf key={themeId} titles={DEMO_TITLES[themeId]} animate className="w-full drop-shadow-[0_14px_20px_rgba(94,73,52,0.18)]" />
        <p className="mt-2 text-center font-sans text-xs leading-snug text-ink-600">
          A sketch of the little shelf you would get.{" "}
          <Link href="/products/custom-mini-book-set" className="font-bold underline">
            See the real ones
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
