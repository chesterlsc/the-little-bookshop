import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { formatMoney, formatRange, type Cents } from "@/lib/money";

type ButtonVariant = "primary" | "blush" | "quiet";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  blush: "btn btn-blush",
  quiet: "btn btn-quiet",
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
  const tones = {
    sage: "bg-sage-200 text-sage-800 border-sage-400",
    blush: "bg-blush-100 text-rose-700 border-blush-300",
    taupe: "bg-taupe-100 text-brown-700 border-taupe-300",
    rose: "bg-rose-300/40 text-rose-700 border-rose-300",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-sans text-[0.72rem] font-bold tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
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
  tint?: "cream" | "sage" | "blush" | "paper";
}) {
  const tints = {
    cream: "bg-cream-50",
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

/** A scalloped color band that closes a tinted section (echoes the shelf edge). */
export function ScallopBand({
  from = "sage",
}: {
  from?: "sage" | "blush" | "paper" | "cream100";
}) {
  const colors = {
    sage: "var(--color-sage-100)",
    blush: "color-mix(in srgb, var(--color-blush-100) 60%, var(--color-cream-50))",
    paper: "var(--color-paper)",
    cream100: "var(--color-cream-100)",
  } as const;
  return (
    <div
      aria-hidden
      className="h-[22px] w-full"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${colors[from]} 21px, transparent 22px)`,
        backgroundSize: "44px 44px",
        backgroundPosition: "0 0",
        backgroundRepeat: "repeat-x",
      }}
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
}: {
  value: number;
  onChange: (next: number) => void;
  label?: string;
  small?: boolean;
}) {
  const size = small ? "h-8 w-8 text-base" : "h-10 w-10 text-lg";
  return (
    <div className="clay-press inline-flex items-center gap-1 rounded-full px-1.5 py-1" role="group" aria-label={label}>
      <button
        type="button"
        className={`${size} rounded-full font-display font-bold text-ink-600 transition hover:bg-cream-50 hover:text-ink-800`}
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        −
      </button>
      <span className={`min-w-7 text-center font-display font-semibold ${small ? "text-sm" : ""}`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={`${size} rounded-full font-display font-bold text-ink-600 transition hover:bg-cream-50 hover:text-ink-800`}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        +
      </button>
    </div>
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
