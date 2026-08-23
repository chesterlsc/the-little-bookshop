import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { formatMoney, formatRange, type Cents } from "@/lib/money";
import { IconCheck, IconMinus, IconPlus } from "./icons";

type ButtonVariant = "primary" | "blush" | "quiet" | "link";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  blush: "btn btn-blush",
  quiet: "btn btn-quiet",
  link: "btn-link", // inline text, deliberately not a .btn box
};

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; className?: string }) {
  return <Link {...props} className={`${variantClass[variant]} ${className}`} />;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button type={type} {...props} className={`${variantClass[variant]} ${className}`} />;
}

export function Badge({
  children,
  tone = "sage",
  className = "",
}: {
  children: ReactNode;
  tone?: "sage" | "blush" | "taupe" | "rose";
  className?: string;
}) {
  return <span className={`tag tag-${tone} ${className}`}>{children}</span>;
}

export function Price({
  min,
  max,
  className = "",
}: {
  min: Cents;
  max?: Cents;
  className?: string;
}) {
  return (
    <span className={`font-display font-semibold text-ink-800 ${className}`}>
      {max !== undefined && max !== min ? formatRange(min, max) : formatMoney(min)}
    </span>
  );
}

/** Section wrapper with consistent horizontal padding + max width */
export function Section({
  children,
  className = "",
  id,
  tint,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tint?: "cream" | "cream100" | "sage" | "blush" | "paper";
}) {
  const tints = {
    cream: "bg-cream-50",
    cream100: "bg-cream-100",
    sage: "bg-sage-100",
    blush: "bg-blush-100/60",
    paper: "bg-paper",
  } as const;
  return (
    <section id={id} className={`${tint ? tints[tint] : ""} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

type BandTone = "cream" | "cream100" | "paper" | "sage" | "blush";

const BAND: Record<BandTone, string> = {
  cream: "var(--color-cream-50)",
  cream100: "var(--color-cream-100)",
  paper: "var(--color-paper)",
  sage: "var(--color-sage-100)",
  blush: "color-mix(in srgb, var(--color-blush-100) 60%, var(--color-cream-50))",
};

/**
 * A hand-drawn scalloped seam between two bands, with an ink line along the
 * curve that draws itself as it scrolls into view.
 *
 * `from` is the toothed colour, `to` is the flat colour behind the teeth.
 * `rise` flips the teeth upward — use it when `from` is the band BELOW.
 */
export function ScallopBand({
  from = "sage",
  to = "cream",
  rise = false,
  className = "",
}: {
  from?: BandTone;
  to?: BandTone;
  rise?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`drawn-edge ${rise ? "drawn-edge--rise" : ""} ${className}`}
      style={{ "--edge-fill": BAND[from], "--edge-under": BAND[to] } as CSSProperties}
    />
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

export function QuantityStepper({
  value,
  onChange,
  label = "Quantity",
  small = false,
  min = 1,
  max = 50, // cart-context clamps here too
}: {
  value: number;
  onChange: (next: number) => void;
  label?: string;
  small?: boolean;
  min?: number;
  max?: number;
}) {
  const glyph = small ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className={`stepper ${small ? "stepper-sm" : ""}`} role="group" aria-label={label}>
      <button
        type="button"
        className="stepper-key"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <IconMinus className={glyph} />
      </button>
      <span className="stepper-val" aria-live="polite" aria-atomic="true">
        {value}
      </span>
      <button
        type="button"
        className="stepper-key"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <IconPlus className={glyph} />
      </button>
    </div>
  );
}

/** The reassurance line. `inline` for the hero, `stack` for product + checkout. */
export function CheckRow({
  items,
  layout = "inline",
  className = "",
}: {
  items: readonly string[];
  layout?: "inline" | "stack";
  className?: string;
}) {
  return (
    <ul
      className={`check-row flex ${
        layout === "inline" ? "flex-wrap gap-x-5 gap-y-2" : "flex-col gap-2"
      } font-sans text-[0.86rem] font-bold text-ink-600 ${className}`}
    >
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2">
          <IconCheck className="mt-[0.05em] h-[1.15em] w-[1.15em] shrink-0 text-sage-700" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block font-sans text-sm font-bold text-ink-800">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-600">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs font-bold text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full rounded-2xl border-[1.5px] border-taupe-300 bg-white/70 px-4 py-2.5 font-sans text-[0.95rem] text-ink-800 placeholder:text-ink-400 shadow-[inset_0_2px_4px_rgba(94,73,52,0.08)] transition focus:border-sage-600 focus:bg-white";
