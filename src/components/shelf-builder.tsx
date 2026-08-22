"use client";

import { useEffect, useRef, useState } from "react";
import {
  SHELF_THEMES,
  colorHex,
  getProduct,
  productsInCategory,
  type Product,
  type ShelfThemeId,
} from "@/lib/catalog";
import { validTitles, type BundleLine, type CustomTitle } from "@/lib/cart";
import { useCart } from "./cart-context";
import { MiniShelf, shelfShapeFromArt } from "./illustrations";
import { ProductThumb } from "./product-thumb";
import { SixTitlesForm, emptyTitles, filledCount } from "./six-titles-form";
import { Badge, Button, Field, inputClass } from "./ui";
import { formatMoney } from "@/lib/money";
import { IconArrowRight, IconBasket, IconCheck, IconPencil } from "./icons";
import Link from "next/link";

const STORAGE_KEY = "tlb-builder-v1";
const SET_PRODUCTS = () => productsInCategory("mini-books");
const SHELF_PRODUCTS = () => productsInCategory("bookshelves");
const ACCESSORY_PRODUCTS = () => productsInCategory("accessories");

interface BuilderState {
  shelfSlug: string | null;
  shelfOptions: Record<string, string>;
  setSlug: string | null;
  coverStyle: string;
  titles: CustomTitle[];
  /** accessory slug -> chosen option value ("" when the accessory has no options) */
  accessories: Record<string, string>;
  themeId: ShelfThemeId | null;
  notes: string;
  step: number;
}

const INITIAL: BuilderState = {
  shelfSlug: null,
  shelfOptions: {},
  setSlug: null,
  coverStyle: "Front, Back & Spine",
  titles: emptyTitles(),
  accessories: {},
  themeId: null,
  notes: "",
  step: 0,
};

const STEPS = ["Shelf", "Style", "Six books", "Extras", "Theme", "Review"] as const;

function loadState(): BuilderState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    const parsed = { ...INITIAL, ...(JSON.parse(raw) as Partial<BuilderState>) };
    if (!Array.isArray(parsed.titles) || parsed.titles.length !== 6) parsed.titles = emptyTitles();
    return parsed;
  } catch {
    return INITIAL;
  }
}

function resolveVariant(product: Product, wanted: Record<string, string>) {
  return product.variants.find((v) =>
    product.options.every((axis) => v.options[axis.name] === wanted[axis.name]),
  );
}

export function ShelfBuilder() {
  const { addLine, openDrawer } = useCart();
  const [state, setState] = useState<BuilderState>(INITIAL);
  const [ready, setReady] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* in-memory only */
    }
  }, [state, ready]);

  const patch = (p: Partial<BuilderState>) => setState((s) => ({ ...s, ...p }));

  const shelf = state.shelfSlug ? getProduct(state.shelfSlug) : undefined;
  const set = state.setSlug ? getProduct(state.setSlug) : undefined;
  const isCustom = Boolean(set?.customSet);

  // ensure shelf options always have a value per axis
  useEffect(() => {
    if (!shelf) return;
    const next = { ...state.shelfOptions };
    let changed = false;
    for (const axis of shelf.options) {
      if (!axis.values.includes(next[axis.name])) {
        next[axis.name] = axis.values[0];
        changed = true;
      }
    }
    // drop stale axes from a previously selected shelf
    for (const key of Object.keys(next)) {
      if (!shelf.options.some((a) => a.name === key)) {
        delete next[key];
        changed = true;
      }
    }
    if (changed) patch({ shelfOptions: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.shelfSlug, ready]);

  const shelfVariant = shelf ? resolveVariant(shelf, state.shelfOptions) : undefined;
  const setVariant = set
    ? set.options.length
      ? resolveVariant(set, { "Cover Style": state.coverStyle })
      : set.variants[0]
    : undefined;

  const accessoryEntries = Object.entries(state.accessories)
    .map(([slug, option]) => {
      const product = getProduct(slug);
      if (!product) return null;
      const variant = product.options.length
        ? product.variants.find((v) => Object.values(v.options)[0] === option)
        : product.variants[0];
      return variant ? { product, variant } : null;
    })
    .filter((e): e is { product: Product; variant: Product["variants"][number] } => Boolean(e));

  const total =
    (shelfVariant?.price ?? 0) +
    (setVariant?.price ?? 0) +
    accessoryEntries.reduce((s, e) => s + e.variant.price, 0);

  const titlesOk = !isCustom || validTitles(state.titles);
  const stepDone = [
    Boolean(shelf),
    Boolean(shelfVariant),
    Boolean(set) && titlesOk,
    true,
    true,
    false,
  ];

  const canReview = stepDone[0] && stepDone[1] && stepDone[2];

  const goto = (step: number) => {
    setShowErrors(false);
    patch({ step });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const next = () => {
    if (state.step === 0 && !stepDone[0]) return setShowErrors(true);
    if (state.step === 2 && !stepDone[2]) return setShowErrors(true);
    goto(Math.min(state.step + 1, STEPS.length - 1));
  };

  const addBundle = () => {
    if (!shelf || !shelfVariant || !set || !setVariant || !titlesOk) {
      setShowErrors(true);
      return;
    }
    const line: Omit<BundleLine, "key"> = {
      type: "bundle",
      qty: 1,
      shelf: { slug: shelf.slug, variantId: shelfVariant.id },
      set: {
        slug: set.slug,
        variantId: setVariant.id,
        titles: isCustom
          ? state.titles.map((t) => ({ title: t.title.trim(), author: t.author.trim() }))
          : undefined,
      },
      accessories: accessoryEntries.map((e) => ({
        slug: e.product.slug,
        variantId: e.variant.id,
      })),
      themeId: state.themeId ?? undefined,
      notes: state.notes.trim() || undefined,
    };
    addLine(line);
    setJustAdded(true);
    openDrawer();
  };

  const startOver = () => {
    setJustAdded(false);
    setState({ ...INITIAL, step: 0 });
  };

  const shelfHex = colorHex(state.shelfOptions["Color"] ?? "") ?? "#eebbaa";
  const shelfSize = state.shelfOptions["Size"] === "Miniature" ? ("miniature" as const) : ("regular" as const);
  const previewTitles = isCustom
    ? state.titles.map((t) => t.title)
    : set
      ? (set.includedTitles ?? ["Book 1", "Book 2", "Book 3", "Book 4", "Book 5", "Book 6"])
      : [];

  if (!ready) {
    return (
      <p className="py-16 text-center font-sans text-ink-600" role="status">
        Setting up your workbench…
      </p>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* stepper */}
      <nav aria-label="Builder steps" className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4">
        <ol className="flex min-w-max items-center justify-center gap-1">
          {STEPS.map((label, i) => {
            const active = state.step === i;
            const done = i < 5 && stepDone[i] && i !== state.step;
            const reachable = i <= 2 || canReview || i <= state.step;
            return (
              <li key={label} className="flex items-center">
                {i > 0 && <span aria-hidden className="mx-0.5 h-px w-3 bg-taupe-300 sm:w-5" />}
                <button
                  type="button"
                  onClick={() => reachable && goto(i)}
                  aria-current={active ? "step" : undefined}
                  disabled={!reachable}
                  className={`flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 font-display text-[0.85rem] font-semibold transition ${
                    active
                      ? "border-sage-800 bg-sage-600 text-cream-50 shadow-[0_2px_0_var(--color-sage-800)]"
                      : done
                        ? "border-sage-400 bg-sage-100 text-sage-800"
                        : "border-taupe-300 bg-cream-50 text-ink-400"
                  } ${reachable && !active ? "hover:border-brown-500 hover:text-ink-800" : ""}`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.7rem] ${
                      active ? "bg-cream-50/25" : done ? "bg-sage-300" : "bg-cream-200"
                    }`}
                    aria-hidden
                  >
                    {done ? <IconCheck className="h-3 w-3" /> : i + 1}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
        {/* ─── step content ─── */}
        <div className="clay p-5 sm:p-6">
          {state.step === 0 && (
            <StepShelf
              selected={state.shelfSlug}
              showErrors={showErrors}
              onSelect={(slug) => patch({ shelfSlug: slug })}
            />
          )}
          {state.step === 1 && shelf && (
            <StepStyle
              shelf={shelf}
              options={state.shelfOptions}
              onChange={(shelfOptions) => patch({ shelfOptions })}
            />
          )}
          {state.step === 1 && !shelf && <NeedShelf onBack={() => goto(0)} />}
          {state.step === 2 && (
            <StepBooks
              selected={state.setSlug}
              coverStyle={state.coverStyle}
              titles={state.titles}
              showErrors={showErrors}
              onSelect={(slug) => patch({ setSlug: slug })}
              onCover={(coverStyle) => patch({ coverStyle })}
              onTitles={(titles) => patch({ titles })}
            />
          )}
          {state.step === 3 && (
            <StepExtras
              chosen={state.accessories}
              onToggle={(slug, option) =>
                setState((s) => {
                  const acc = { ...s.accessories };
                  if (slug in acc && acc[slug] === option) delete acc[slug];
                  else acc[slug] = option;
                  return { ...s, accessories: acc };
                })
              }
              onOption={(slug, option) =>
                setState((s) => ({ ...s, accessories: { ...s.accessories, [slug]: option } }))
              }
            />
          )}
          {state.step === 4 && (
            <StepTheme
              themeId={state.themeId}
              notes={state.notes}
              onTheme={(themeId) => patch({ themeId })}
              onNotes={(notes) => patch({ notes })}
            />
          )}
          {state.step === 5 && (
            <StepReview
              shelf={shelf}
              shelfVariant={shelfVariant}
              set={set}
              setVariant={setVariant}
              titles={isCustom ? state.titles : undefined}
              accessories={accessoryEntries}
              themeId={state.themeId}
              notes={state.notes}
              total={total}
              ok={canReview}
              justAdded={justAdded}
              onEdit={goto}
              onAdd={addBundle}
              onStartOver={startOver}
            />
          )}

          {/* step nav */}
          {state.step < 5 && (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-brown-500/10 pt-4">
              <Button variant="quiet" onClick={() => goto(Math.max(0, state.step - 1))} disabled={state.step === 0}>
                Back
              </Button>
              {state.step === 4 ? (
                <Button onClick={() => goto(5)} disabled={!canReview} aria-disabled={!canReview}>
                  Review my shelf <IconArrowRight className="h-4.5 w-4.5" />
                </Button>
              ) : (
                <Button onClick={next}>
                  Next: {STEPS[state.step + 1]} <IconArrowRight className="h-4.5 w-4.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ─── live preview ─── */}
        <aside className="clay sticky top-24 hidden p-5 lg:block" aria-label="Your shelf so far">
          <p className="eyebrow mb-2">Your shelf so far</p>
          <MiniShelf
            titles={previewTitles}
            shelfColor={shelfHex}
            shape={shelf ? shelfShapeFromArt(shelf.art) : "scalloped"}
            size={shelfSize}
            animate
            className="w-full"
          />
          <p className="mt-1.5 text-center font-sans text-[0.7rem] leading-snug text-ink-600">
            A sketch preview. Your books arrive as printed miniatures.
          </p>
          <dl className="mt-3 space-y-1.5 font-sans text-[0.85rem]">
            <PreviewRow label="Shelf" value={shelf ? `${shelf.name}${state.shelfOptions["Size"] ? ` · ${state.shelfOptions["Size"]}` : ""}` : "—"} />
            <PreviewRow label="Color" value={state.shelfOptions["Color"] ?? "—"} swatch={shelf ? shelfHex : undefined} />
            <PreviewRow
              label="Books"
              value={set ? (isCustom ? `Custom set · ${filledCount(state.titles)}/6 titles` : set.name) : "—"}
            />
            <PreviewRow
              label="Extras"
              value={accessoryEntries.length ? accessoryEntries.map((e) => e.product.name).join(", ") : "—"}
            />
            <PreviewRow label="Theme" value={SHELF_THEMES.find((t) => t.id === state.themeId)?.name ?? "—"} />
          </dl>
          <div className="mt-3 flex items-baseline justify-between border-t border-brown-500/10 pt-3">
            <span className="font-sans text-sm font-bold text-ink-600">Bundle so far</span>
            <span className="font-display text-xl font-bold" aria-live="polite">
              {formatMoney(total)}
            </span>
          </div>
        </aside>
      </div>

      {/* mobile mini-summary */}
      <div className="clay-sm mt-4 flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-16 shrink-0">
            <MiniShelf titles={previewTitles} shelfColor={shelfHex} shape={shelf ? shelfShapeFromArt(shelf.art) : "scalloped"} size={shelfSize} accent={false} className="w-full" />
          </div>
          <p className="font-sans text-xs text-ink-600">
            {shelf ? shelf.name : "No shelf yet"}
            {set ? ` + ${isCustom ? "custom six" : "a set of six"}` : ""}
            {accessoryEntries.length ? ` + ${accessoryEntries.length} extra${accessoryEntries.length > 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <span className="font-display text-lg font-bold">{formatMoney(total)}</span>
      </div>
    </div>
  );
}

/* ─── step components ─────────────────────────────────────────────────────── */

function StepHeading({ title, lede }: { title: string; lede: string }) {
  return (
    <header className="mb-4">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-1 font-sans text-[0.95rem] text-ink-600">{lede}</p>
    </header>
  );
}

function NeedShelf({ onBack }: { onBack: () => void }) {
  return (
    <div className="py-8 text-center">
      <p className="font-display text-lg font-bold">First things first</p>
      <p className="mt-1 font-sans text-sm text-ink-600">Pick a shelf and we'll style it together.</p>
      <Button variant="blush" className="mt-4" onClick={onBack}>
        Choose a shelf
      </Button>
    </div>
  );
}

function StepShelf({
  selected,
  showErrors,
  onSelect,
}: {
  selected: string | null;
  showErrors: boolean;
  onSelect: (slug: string) => void;
}) {
  return (
    <div>
      <StepHeading title="Choose your shelf" lede="Six silhouettes, all made to order. You'll pick size and color next." />
      {showErrors && !selected && (
        <p className="stitch mb-3 bg-blush-100/60 px-3 py-2 font-sans text-sm font-bold text-rose-700" role="alert">
          Pick a shelf to keep going.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Shelf style">
        {SHELF_PRODUCTS().map((p) => {
          const active = selected === p.slug;
          return (
            <button
              key={p.slug}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(p.slug)}
              className={`clay-sm clay-hover flex flex-col items-center gap-1 p-3 text-center transition ${
                active ? "!border-sage-700 !bg-sage-100 shadow-[0_0_0_2px_var(--color-sage-500)]" : ""
              }`}
            >
              <ProductThumb product={p} className="h-24 w-24" sizes="96px" />
              <span className="font-display text-[0.92rem] font-semibold leading-tight">{p.name.replace("Mini ", "").replace(" Bookshelf", "")}</span>
              <span className="font-sans text-xs text-ink-600">from {formatMoney(p.minPrice)}</span>
              {active && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sage-600 px-2 py-0.5 font-sans text-[0.68rem] font-bold text-cream-50">
                  <IconCheck className="h-3 w-3" /> chosen
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepStyle({
  shelf,
  options,
  onChange,
}: {
  shelf: Product;
  options: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <div>
      <StepHeading title={`Style your ${shelf.name.toLowerCase()}`} lede="Every color is mixed in the studio; every size is desk-friendly." />
      <div className="space-y-5">
        {shelf.options.map((axis) => {
          const isColor = axis.name === "Color";
          return (
            <fieldset key={axis.name}>
              <legend className="mb-2 font-sans text-sm font-bold">
                {axis.name}: <span className="font-normal text-ink-600">{options[axis.name]}</span>
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={axis.name}>
                {axis.values.map((value) => {
                  const active = options[axis.name] === value;
                  const hex = isColor ? colorHex(value) : undefined;
                  return isColor && hex ? (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={value}
                      title={value}
                      onClick={() => onChange({ ...options, [axis.name]: value })}
                      className={`h-10 w-10 rounded-full border-2 transition ${
                        active
                          ? "scale-110 border-ink-800 shadow-[0_0_0_3px_var(--color-cream-50),0_0_0_5px_var(--color-sage-500)]"
                          : "border-ink-800/25 hover:scale-105"
                      }`}
                      style={{ background: hex }}
                    />
                  ) : (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChange({ ...options, [axis.name]: value })}
                      className={`rounded-full border-[1.5px] px-4 py-2 font-display text-[0.92rem] font-semibold transition ${
                        active
                          ? "border-sage-800 bg-sage-600 text-cream-50 shadow-[0_2px_0_var(--color-sage-800)]"
                          : "border-taupe-300 bg-cream-50 text-ink-600 hover:border-brown-500 hover:text-ink-800"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
        {shelf.details.dimensions && (
          <div className="stitch bg-paper p-3.5">
            <p className="font-sans text-xs font-bold text-ink-800">Size guide</p>
            <ul className="mt-1 list-disc pl-4 font-sans text-xs leading-relaxed text-ink-600">
              {shelf.details.dimensions.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function StepBooks({
  selected,
  coverStyle,
  titles,
  showErrors,
  onSelect,
  onCover,
  onTitles,
}: {
  selected: string | null;
  coverStyle: string;
  titles: CustomTitle[];
  showErrors: boolean;
  onSelect: (slug: string) => void;
  onCover: (style: string) => void;
  onTitles: (titles: CustomTitle[]) => void;
}) {
  const sets = SET_PRODUCTS();
  const custom = sets.find((s) => s.customSet);
  const ready = sets.filter((s) => !s.customSet);
  const chosen = selected ? getProduct(selected) : undefined;

  return (
    <div>
      <StepHeading
        title="Pick your six books"
        lede="Every shelf ships with a set of six mini books, ready-made or made from your own list."
      />
      {showErrors && !chosen && (
        <p className="stitch mb-3 bg-blush-100/60 px-3 py-2 font-sans text-sm font-bold text-rose-700" role="alert">
          Choose a set of six to keep going.
        </p>
      )}

      {custom && (
        <button
          type="button"
          onClick={() => onSelect(custom.slug)}
          aria-pressed={selected === custom.slug}
          className={`clay-sm clay-hover mb-3 flex w-full items-center gap-4 p-4 text-left ${
            selected === custom.slug ? "!border-sage-700 !bg-sage-100 shadow-[0_0_0_2px_var(--color-sage-500)]" : ""
          }`}
        >
          <ProductThumb product={custom} className="h-20 w-20 shrink-0" sizes="80px" />
          <span>
            <span className="flex flex-wrap items-center gap-2 font-display text-[1.05rem] font-bold">
              Custom set, your six titles <Badge tone="rose">most loved</Badge>
            </span>
            <span className="mt-0.5 block font-sans text-sm text-ink-600">
              {custom.blurb} {formatMoney(custom.minPrice)}.
            </span>
          </span>
        </button>
      )}

      <p className="eyebrow mb-2 mt-5">Or a ready-made set</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ready.map((p) => {
          const active = selected === p.slug;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onSelect(p.slug)}
              aria-pressed={active}
              className={`clay-sm flex items-center gap-3 p-3 text-left transition hover:border-brown-500 ${
                active ? "!border-sage-700 !bg-sage-100 shadow-[0_0_0_2px_var(--color-sage-500)]" : ""
              }`}
            >
              <ProductThumb product={p} className="h-14 w-14 shrink-0" sizes="56px" />
              <span>
                <span className="block font-display text-[0.95rem] font-semibold leading-tight">{p.name}</span>
                <span className="font-sans text-xs text-ink-600">{formatMoney(p.minPrice)} · set of six</span>
              </span>
            </button>
          );
        })}
      </div>

      {chosen && (
        <div className="mt-5 space-y-4">
          <fieldset>
            <legend className="mb-2 font-sans text-sm font-bold">Cover style</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cover style">
              {(chosen.options.find((o) => o.name === "Cover Style")?.values ?? []).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={coverStyle === v}
                  onClick={() => onCover(v)}
                  className={`rounded-full border-[1.5px] px-4 py-2 font-display text-[0.92rem] font-semibold transition ${
                    coverStyle === v
                      ? "border-sage-800 bg-sage-600 text-cream-50 shadow-[0_2px_0_var(--color-sage-800)]"
                      : "border-taupe-300 bg-cream-50 text-ink-600 hover:border-brown-500 hover:text-ink-800"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </fieldset>

          {chosen.customSet ? (
            <div className="clay p-4">
              <SixTitlesForm titles={titles} onChange={onTitles} showErrors={showErrors} idPrefix="builder" />
            </div>
          ) : (
            <div className="stitch bg-paper p-4">
              <p className="font-display font-bold">The six inside</p>
              {chosen.includedTitles ? (
                <ol className="mt-1.5 grid list-decimal gap-1 pl-5 font-sans text-sm text-ink-600 sm:grid-cols-2">
                  {chosen.includedTitles.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ol>
              ) : (
                <p className="mt-1 font-sans text-sm text-ink-600">
                  Six covers from this series. The exact list arrives with your order confirmation.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepExtras({
  chosen,
  onToggle,
  onOption,
}: {
  chosen: Record<string, string>;
  onToggle: (slug: string, option: string) => void;
  onOption: (slug: string, option: string) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Add tiny extras"
        lede="Optional, but a shelf with a plant on it feels lived-in. Tap to add or remove."
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {ACCESSORY_PRODUCTS().map((p) => {
          const inBundle = p.slug in chosen;
          const axis = p.options[0];
          return (
            <div
              key={p.slug}
              className={`clay-sm p-3 transition ${inBundle ? "!border-sage-700 !bg-sage-100 shadow-[0_0_0_2px_var(--color-sage-500)]" : ""}`}
            >
              <button
                type="button"
                onClick={() => onToggle(p.slug, axis ? (chosen[p.slug] ?? axis.values[0]) : "")}
                aria-pressed={inBundle}
                className="flex w-full items-center gap-3 text-left"
              >
                <ProductThumb product={p} className="h-14 w-14 shrink-0" sizes="56px" />
                <span className="flex-1">
                  <span className="block font-display text-[0.95rem] font-semibold">{p.name}</span>
                  <span className="font-sans text-xs text-ink-600">{formatMoney(p.minPrice)}</span>
                </span>
                <span
                  aria-hidden
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] font-display text-lg font-bold ${
                    inBundle ? "border-sage-800 bg-sage-600 text-cream-50" : "border-taupe-300 text-taupe-500"
                  }`}
                >
                  {inBundle ? "✓" : "+"}
                </span>
              </button>
              {inBundle && axis && (
                <div className="mt-2 border-t border-brown-500/10 pt-2">
                  <label htmlFor={`acc-${p.slug}`} className="mr-2 font-sans text-xs font-bold text-ink-600">
                    {axis.name}:
                  </label>
                  <select
                    id={`acc-${p.slug}`}
                    value={chosen[p.slug]}
                    onChange={(e) => onOption(p.slug, e.target.value)}
                    className="rounded-xl border-[1.5px] border-taupe-300 bg-white/70 px-2.5 py-1.5 font-sans text-sm"
                  >
                    {axis.values.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepTheme({
  themeId,
  notes,
  onTheme,
  onNotes,
}: {
  themeId: ShelfThemeId | null;
  notes: string;
  onTheme: (id: ShelfThemeId | null) => void;
  onNotes: (notes: string) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Give it a theme"
        lede="Optional. A theme helps us style your set, and makes a lovely gift note."
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Shelf theme">
        {SHELF_THEMES.map((t) => {
          const active = themeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => onTheme(active ? null : t.id)}
              className={`rounded-full border-[1.5px] px-4 py-2 font-display text-[0.92rem] font-semibold transition ${
                active
                  ? "border-sage-800 bg-sage-600 text-cream-50 shadow-[0_2px_0_var(--color-sage-800)]"
                  : "border-taupe-300 bg-cream-50 text-ink-600 hover:border-brown-500 hover:text-ink-800"
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>
      {themeId && (
        <p className="story-line mt-3 text-ink-600" aria-live="polite">
          “{SHELF_THEMES.find((t) => t.id === themeId)?.line}”
        </p>
      )}
      <div className="mt-5">
        <Field
          label="Notes or special requests (optional)"
          htmlFor="builder-notes"
          hint="Editions you love, a gift message, anything that helps us get it right."
        >
          <textarea
            id="builder-notes"
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            rows={3}
            maxLength={500}
            className={`${inputClass} resize-y`}
          />
        </Field>
      </div>
    </div>
  );
}

function StepReview(props: {
  shelf?: Product;
  shelfVariant?: Product["variants"][number];
  set?: Product;
  setVariant?: Product["variants"][number];
  titles?: CustomTitle[];
  accessories: { product: Product; variant: Product["variants"][number] }[];
  themeId: ShelfThemeId | null;
  notes: string;
  total: number;
  ok: boolean;
  justAdded: boolean;
  onEdit: (step: number) => void;
  onAdd: () => void;
  onStartOver: () => void;
}) {
  const { shelf, shelfVariant, set, setVariant, titles, accessories, themeId, notes, total, ok, justAdded, onEdit, onAdd, onStartOver } = props;
  const theme = SHELF_THEMES.find((t) => t.id === themeId);

  if (justAdded) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-sage-600 text-cream-50">
          <IconCheck className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">Your little shelf is in the basket</h2>
        <p className="mx-auto mt-2 max-w-[40ch] font-sans text-[0.95rem] text-ink-600">
          It's saved with all six titles, your colors and your notes. You can review
          everything again at checkout.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/checkout" className="btn btn-primary">
            Go to checkout
          </Link>
          <Button variant="quiet" onClick={onStartOver}>
            Build another shelf
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepHeading title="One last look" lede="Everything below ships together as one bundle, in the illustrated box." />
      {!ok && (
        <p className="stitch mb-3 bg-blush-100/60 px-3 py-2 font-sans text-sm font-bold text-rose-700" role="alert">
          A bundle needs a shelf and a set of six (with all six titles) before it can join the basket.
        </p>
      )}
      <div className="divide-y divide-brown-500/10">
        <ReviewRow
          onEdit={onEdit}
          label="Shelf"
          step={shelf ? 1 : 0}
          price={shelfVariant?.price}
          value={
            shelf ? (
              <>
                {shelf.name}
                {shelfVariant && (
                  <span className="text-ink-600">, {Object.values(shelfVariant.options).join(" · ")}</span>
                )}
              </>
            ) : (
              <em className="text-rose-600">not chosen yet</em>
            )
          }
        />
        <ReviewRow
          onEdit={onEdit}
          label="Six books"
          step={2}
          price={setVariant?.price}
          value={
            set ? (
              <>
                {set.name}
                {setVariant?.options["Cover Style"] && (
                  <span className="text-ink-600">, {setVariant.options["Cover Style"]}</span>
                )}
                {titles && (
                  <ol className="mt-1 grid list-decimal gap-0.5 pl-5 text-sm text-ink-600 sm:grid-cols-2">
                    {titles.map((t, i) => (
                      <li key={i}>
                        {t.title.trim() || <em className="text-rose-600">missing</em>}
                        {t.author.trim() ? `, ${t.author.trim()}` : ""}
                      </li>
                    ))}
                  </ol>
                )}
              </>
            ) : (
              <em className="text-rose-600">not chosen yet</em>
            )
          }
        />
        <ReviewRow
          onEdit={onEdit}
          label="Extras"
          step={3}
          price={accessories.length ? accessories.reduce((s, e) => s + e.variant.price, 0) : undefined}
          value={
            accessories.length ? (
              <ul className="space-y-0.5">
                {accessories.map((e) => (
                  <li key={e.product.slug}>
                    {e.product.name}
                    {Object.values(e.variant.options)[0] && (
                      <span className="text-ink-600">, {Object.values(e.variant.options)[0]}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-ink-600">none, a very minimalist shelf</span>
            )
          }
        />
        <ReviewRow
          onEdit={onEdit}
          label="Theme & notes"
          step={4}
          value={
            <>
              {theme ? theme.name : <span className="text-ink-600">no theme</span>}
              {notes.trim() && <p className="mt-0.5 text-sm italic text-ink-600">“{notes.trim()}”</p>}
            </>
          }
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t-2 border-brown-500/15 pt-4">
        <span className="font-display text-lg font-bold">Bundle total</span>
        <span className="font-display text-2xl font-bold">{formatMoney(total)}</span>
      </div>
      <p className="mt-1 font-sans text-xs text-ink-400">
        Shipping is added at checkout. Prices are confirmed again on the server before payment.
      </p>
      <Button onClick={onAdd} disabled={!ok} aria-disabled={!ok} className="mt-4 w-full !py-4 text-lg">
        <IconBasket className="h-5 w-5" /> Add my little shelf to the basket
      </Button>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  price,
  step,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  price?: number;
  step: number;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="font-sans text-xs font-bold uppercase tracking-wide text-ink-400">{label}</p>
        <div className="font-sans text-[0.95rem] text-ink-800">{value}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {price !== undefined && <span className="font-display font-semibold">{formatMoney(price)}</span>}
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="rounded-full p-1.5 text-ink-400 transition hover:bg-cream-200 hover:text-ink-800"
          aria-label={`Edit ${label.toLowerCase()}`}
        >
          <IconPencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PreviewRow({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 font-bold text-ink-400">{label}</dt>
      <dd className="truncate text-right text-ink-800">
        {swatch && (
          <span
            aria-hidden
            className="mr-1.5 inline-block h-3 w-3 rounded-full border border-ink-800/25 align-[-1px]"
            style={{ background: swatch }}
          />
        )}
        {value}
      </dd>
    </div>
  );
}
