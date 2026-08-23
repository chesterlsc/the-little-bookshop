import Image from "next/image";
import { SketchScene } from "@/components/sketch-scene";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading The Little Bookshop">
      <div className="text-center">
        <SketchScene className="mx-auto w-56 sm:w-64" />
        <Image
          src="/brand/logo_wordmark_h.png"
          alt=""
          aria-hidden
          width={1127}
          height={120}
          priority
          className="soft-in mx-auto mt-4 h-5 w-auto"
          style={{ animationDelay: "1250ms" }}
        />
        <p className="soft-in mt-2 font-sans text-sm text-ink-600" style={{ animationDelay: "1450ms" }}>
          Opening the shop…
        </p>
      </div>
    </div>
  );
}
