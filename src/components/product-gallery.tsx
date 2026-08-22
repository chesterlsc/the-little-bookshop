"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/catalog";

export function ProductGallery({
  images,
  name,
  soldOut,
}: {
  images: ProductImage[];
  name: string;
  soldOut?: boolean;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="min-w-0 space-y-3">
      <div className="clay relative aspect-square overflow-hidden p-2">
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          priority
          sizes="(min-width:1024px) 44vw, 92vw"
          className="animate-fade-up rounded-[18px] object-cover"
        />
        {soldOut && (
          <span className="absolute left-4 top-4 rounded-full bg-ink-800/85 px-3 py-1.5 font-sans text-xs font-bold tracking-wide text-cream-50">
            Sold out, back soon
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}: ${img.alt}`}
                aria-current={i === active}
                className={`relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-[4.5rem] sm:w-[4.5rem] ${
                  i === active
                    ? "border-sage-500"
                    : "border-taupe-200/70 opacity-75 hover:opacity-100"
                }`}
              >
                <Image src={img.src} alt="" fill sizes="72px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="font-sans text-xs leading-snug text-ink-600">
        {current.kind === "chart"
          ? `A size and color reference for the ${name}, not a styled photo.`
          : "Photographed in our studio. Colors shift a little between screens, and between batches."}
      </p>
    </div>
  );
}
