/**
 * The one place that knows where a half-built shelf is kept, so the picker on
 * the home page can start a build the builder will recognise.
 *
 * The picker answers the builder's first question (which shelf), and the
 * builder asks the next one (which size and colour) against its own swatches.
 * Seeding merges into whatever is already saved rather than replacing it, so
 * someone who wandered back to the home page mid-build keeps their six titles,
 * their extras and their notes.
 */

export const BUILDER_STORAGE_KEY = "tlb-builder-v1";

/** Index of "Style" — size and colour — in the builder's own step list. */
export const BUILDER_STYLE_STEP = 1;

export function seedBuilderShelf(shelfSlug: string): void {
  try {
    const raw = window.localStorage.getItem(BUILDER_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    window.localStorage.setItem(
      BUILDER_STORAGE_KEY,
      JSON.stringify({ ...saved, shelfSlug, step: BUILDER_STYLE_STEP }),
    );
  } catch {
    /* private mode or a full quota: the builder simply opens at its first step */
  }
}
