"use client";

import { MAX_TITLES, SET_SIZE } from "@/lib/catalog";
import type { CustomTitle } from "@/lib/cart";
import { inputClass } from "./ui";
import { IconCheck } from "./icons";

export function emptyTitles(): CustomTitle[] {
  return Array.from({ length: SET_SIZE }, () => ({ title: "", author: "" }));
}

export function filledCount(titles: CustomTitle[]): number {
  return titles.filter((t) => t.title.trim()).length;
}

/**
 * The numbered title fields, the heart of the custom set: six of them, and
 * six more for every extra set the customer adds.
 * `showErrors` highlights the empty slots after a failed submit.
 */
export function SixTitlesForm({
  titles,
  onChange,
  showErrors = false,
  idPrefix = "set",
}: {
  titles: CustomTitle[];
  onChange: (next: CustomTitle[]) => void;
  showErrors?: boolean;
  idPrefix?: string;
}) {
  const done = filledCount(titles);

  const update = (i: number, patch: Partial<CustomTitle>) => {
    onChange(titles.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  };

  return (
    <fieldset>
      <legend className="mb-1 flex w-full items-center justify-between gap-3">
        <span className="font-display text-[1.02rem] font-bold">
          {titles.length === SET_SIZE ? "Your six books" : `Your ${titles.length} books`}
        </span>
        <span
          className={`font-sans text-xs font-bold ${done === titles.length ? "text-sage-700" : "text-ink-600"}`}
          aria-live="polite"
        >
          {done === titles.length ? (
            <span className="inline-flex items-center gap-1">
              <IconCheck className="h-3.5 w-3.5" /> all {titles.length} chosen
            </span>
          ) : (
            `${done} of ${titles.length} chosen`
          )}
        </span>
      </legend>
      <p className="mb-3 font-sans text-xs text-ink-600">
        Books are made six at a time, so add them a set at a time. Authors are optional but help us
        find the right covers.
      </p>
      <ol className="space-y-2.5">
        {titles.map((t, i) => {
          const missing = showErrors && !t.title.trim();
          return (
            <li key={i} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className={`mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold shadow-[inset_0_1.5px_0_rgba(255,255,255,0.7)] ${
                  t.title.trim()
                    ? "bg-sage-300 text-sage-800"
                    : missing
                      ? "bg-rose-300/60 text-rose-700"
                      : "bg-cream-200 text-ink-600"
                }`}
              >
                {i + 1}
              </span>
              <div className="grid flex-1 gap-1.5 sm:grid-cols-[1.4fr_1fr]">
                <div>
                  <label htmlFor={`${idPrefix}-title-${i}`} className="sr-only">
                    Book {i + 1} title (required)
                  </label>
                  <input
                    id={`${idPrefix}-title-${i}`}
                    type="text"
                    value={t.title}
                    required
                    aria-invalid={missing || undefined}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder={`Book ${i + 1} title`}
                    className={`${inputClass} ${missing ? "!border-rose-500 !bg-rose-300/10" : ""}`}
                  />
                  {missing && (
                    <p className="mt-1 text-xs font-bold text-rose-600" role="alert">
                      Please add a title for book {i + 1}.
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor={`${idPrefix}-author-${i}`} className="sr-only">
                    Book {i + 1} author (optional)
                  </label>
                  <input
                    id={`${idPrefix}-author-${i}`}
                    type="text"
                    value={t.author}
                    onChange={(e) => update(i, { author: e.target.value })}
                    placeholder="Author (optional)"
                    className={inputClass}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {titles.length + SET_SIZE <= MAX_TITLES && (
          <button
            type="button"
            onClick={() => onChange([...titles, ...emptyTitles()])}
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-taupe-300 bg-cream-50 px-3.5 py-1.5 font-display text-[0.9rem] font-semibold text-ink-600 transition hover:border-brown-500 hover:text-ink-800"
          >
            <span aria-hidden className="font-bold">+</span> Add six more books
          </button>
        )}
        {titles.length > SET_SIZE && (
          <button
            type="button"
            onClick={() => onChange(titles.slice(0, -SET_SIZE))}
            className="btn-link py-1.5 text-sm"
          >
            Remove the last six
          </button>
        )}
      </div>
    </fieldset>
  );
}
