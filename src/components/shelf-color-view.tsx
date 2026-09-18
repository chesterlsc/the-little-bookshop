"use client";

import type { CSSProperties } from "react";
import { colorHex, shelfColorReel, type Product } from "@/lib/catalog";
import { MiniShelf, shelfShapeFromArt } from "./illustrations";

/**
 * The chosen shelf, in the chosen colour, above the size on the Style step.
 *
 * It is the shop's own colour line-up — seven real shelves photographed side by
 * side — drawn as a reel with the chosen one dead centre and its neighbours
 * fading off either side. Picking another colour slides the whole strip along
 * to it, so the colours in between pass through frame on the way: a
 * photograph of the actual thing, never a tint of a drawing.
 *
 * The reel is wider on a wide screen (more of the line-up shows) and squarer on
 * a phone (the chosen shelf gets the height). Its box keeps a fixed aspect at
 * each size, which is what lets the slide be pure CSS percentages.
 *
 * Two of the nine colours were never photographed. Those show the drawn shelf,
 * tinted, and say so: better a sketch admitted than the wrong colour shown.
 */

/** width over height of the reel's box, phone and wide */
const ASPECT = { phone: 1.15, wide: 2.3 };

export function ShelfColorView({
  shelf,
  color,
  size,
}: {
  shelf: Product;
  color: string;
  size: string;
}) {
  const phone = shelfColorReel(shelf.slug, color, ASPECT.phone);
  const wide = shelfColorReel(shelf.slug, color, ASPECT.wide);
  const hex = colorHex(color) ?? "#eebbaa";
  const dimension = shelf.details.dimensions?.find((d) => d.startsWith(size))?.replace(/^[^:]*:\s*/, "");

  return (
    <figure className="clay-sm m-0 overflow-hidden bg-paper p-2 sm:p-2.5">
      {phone && wide ? (
        <div
          className="shelf-reel relative w-full rounded-[0.8rem]"
          style={
            {
              "--reel-img": `url(${phone.src})`,
              "--reel-wall-l": phone.wallLeft,
              "--reel-wall-r": phone.wallRight,
              "--reel-size": phone.size,
              "--reel-x": phone.positionX,
              "--reel-size-wide": wide.size,
              "--reel-x-wide": wide.positionX,
              "--reel-y": phone.positionY,
            } as CSSProperties
          }
          role="img"
          aria-label={`The ${shelf.name} in ${color}, from the shop's colour line-up`}
        />
      ) : (
        <div className="shelf-reel-drawn flex w-full items-end justify-center rounded-[0.8rem] bg-cream-100 pt-3">
          <MiniShelf
            shelfColor={hex}
            shape={shelfShapeFromArt(shelf.art)}
            size={size === "Mini" ? "miniature" : "regular"}
            accent={false}
            className="h-full w-auto"
            label={`A drawing of the ${shelf.name}, tinted ${color}`}
          />
        </div>
      )}

      <figcaption className="px-2 pb-1.5 pt-3 text-center">
        <p className="flex items-center justify-center gap-2 font-display text-[1.15rem] font-bold leading-tight text-ink-900">
          <span
            aria-hidden
            className="h-3.5 w-3.5 shrink-0 rounded-full border border-ink-800/30"
            style={{ background: hex }}
          />
          {color}
          <span className="font-sans text-[0.82rem] font-bold text-sage-700">· {size}</span>
        </p>
        {dimension && (
          <p className="mt-0.5 font-sans text-[0.76rem] text-ink-600">{dimension}</p>
        )}
        <p className="story-line mt-1 text-[0.78rem] leading-snug text-ink-400">
          {phone
            ? "The real shelf, from our colour line-up."
            : `We haven't photographed ${color} yet, so this one is drawn.`}
        </p>
      </figcaption>
    </figure>
  );
}
