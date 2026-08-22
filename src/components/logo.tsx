import Image from "next/image";
import Link from "next/link";

export function LogoFull({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo_full.png"
      alt="The Little Bookshop, an open book with leaves and flowers"
      width={989}
      height={816}
      priority={priority}
      className={className}
    />
  );
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/brand/logo_book_icon.png"
      alt=""
      aria-hidden
      width={711}
      height={214}
      className={className}
    />
  );
}

/** Horizontal lockup for navigation bars. */
export function LogoHorizontal({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="The Little Bookshop, home">
      <Image
        src="/brand/logo_book_icon.png"
        alt=""
        aria-hidden
        width={711}
        height={214}
        className="h-7 w-auto transition-transform duration-300 group-hover:-rotate-3"
      />
      <Image
        src="/brand/logo_wordmark_h.png"
        alt=""
        aria-hidden
        width={1127}
        height={120}
        className="h-[1.2rem] w-auto max-[400px]:h-4"
      />
    </Link>
  );
}
