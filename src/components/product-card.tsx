import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/catalog";
import { ProductArt } from "./illustrations";
import { Badge, Price } from "./ui";

export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const shots = product.images.filter((i) => i.kind === "photo");
  const photo = shots[0] ?? product.images[0];
  const hover = shots[1];
  return (
    <Link
      href={`/products/${product.slug}`}
      className="clay clay-hover group flex flex-col overflow-hidden"
      aria-label={`${product.name}, ${product.available ? "view product" : "currently unavailable"}`}
    >
      <div className="relative m-3 mb-0 flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-taupe-200/70 bg-paper">
        {photo ? (
          <>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={eager}
              className={`object-cover transition duration-500 group-hover:scale-[1.04] ${hover ? "group-hover:opacity-0" : ""}`}
            />
            {hover && (
              <Image
                src={hover.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="scale-[1.04] object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <ProductArt
            kind={product.art}
            title={product.name}
            className="h-[82%] w-[82%] transition-transform duration-500 group-hover:scale-[1.05] group-hover:-rotate-1"
          />
        )}
        {!product.available && (
          <span className="absolute left-2 top-2 rounded-full bg-ink-800/85 px-2.5 py-1 font-sans text-[0.68rem] font-bold tracking-wide text-cream-50">
            Sold out, back soon
          </span>
        )}
        {product.setOfSix && product.available && (
          <span className="absolute left-2 top-2">
            <Badge tone="rose">Set of six</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 pt-3">
        <h3 className="font-display text-[1.05rem] font-semibold leading-snug">{product.name}</h3>
        <p className="mt-0.5 line-clamp-2 font-sans text-[0.82rem] leading-snug text-ink-600">
          {product.blurb}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2.5">
          <Price min={product.minPrice} max={product.maxPrice} className="text-[1.02rem]" />
          {product.customSet || product.customSingle ? (
            <Badge tone="sage">Personalized</Badge>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
