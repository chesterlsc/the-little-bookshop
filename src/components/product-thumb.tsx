import Image from "next/image";
import type { Product } from "@/lib/catalog";
import { ProductArt } from "./illustrations";

/** Square product photo for lists, carts and pickers; falls back to studio art. */
export function ProductThumb({
  product,
  className = "",
  sizes = "96px",
}: {
  product: Product;
  className?: string;
  sizes?: string;
}) {
  const photo = product.images.find((i) => i.kind === "photo") ?? product.images[0];
  if (!photo) {
    return <ProductArt kind={product.art} title={product.name} className={className} />;
  }
  return (
    <span className={`relative block overflow-hidden rounded-xl bg-paper ${className}`}>
      <Image src={photo.src} alt={product.name} fill sizes={sizes} className="object-cover" />
    </span>
  );
}
