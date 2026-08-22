"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { colorHex, SET_SIZE } from "@/lib/catalog";
import { validTitles, type CustomTitle } from "@/lib/cart";
import { useCart } from "./cart-context";
import { Button, Field, inputClass, QuantityStepper } from "./ui";
import { SixTitlesForm, emptyTitles } from "./six-titles-form";
import { MiniShelf } from "./illustrations";
import { formatMoney } from "@/lib/money";
import { IconBasket } from "./icons";

export function ProductConfigurator({ product }: { product: Product }) {
  const { addLine, openDrawer } = useCart();
  const firstAvailable =
    product.variants.find((v) => v.available) ?? product.variants[0];
  const [selection, setSelection] = useState<Record<string, string>>({
    ...firstAvailable.options,
  });
  const [qty, setQty] = useState(1);
  const [titles, setTitles] = useState<CustomTitle[]>(emptyTitles());
  const [singleTitle, setSingleTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () =>
      product.variants.find((v) =>
        Object.entries(selection).every(([k, val]) => v.options[k] === val),
      ),
    [product.variants, selection],
  );

  const price = variant?.price ?? product.minPrice;
  const canBuy = product.available && variant?.available;

  const needsTitles = product.customSet;
  const titlesOk = !needsTitles || validTitles(titles);
  const singleOk = !product.customSingle || singleTitle.trim().length > 0;

  const handleAdd = () => {
    if (!variant || !canBuy) return;
    if (!titlesOk || !singleOk) {
      setShowErrors(true);
      document
        .querySelector("[data-personalize]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addLine({
      type: "product",
      slug: product.slug,
      variantId: variant.id,
      qty,
      titles: needsTitles ? titles.map((t) => ({ title: t.title.trim(), author: t.author.trim() })) : undefined,
      singleTitle: product.customSingle ? singleTitle.trim() : undefined,
      notes: notes.trim() || undefined,
    });
    setAdded(true);
    setShowErrors(false);
    window.setTimeout(() => setAdded(false), 1800);
    openDrawer();
  };

  return (
    <div className="space-y-5">
      {/* price */}
      <p className="font-display text-[1.7rem] font-bold" aria-live="polite">
        {formatMoney(price)}
        {product.setOfSix && (
          <span className="ml-2 align-middle font-sans text-sm font-bold text-ink-600">
            for the set of six
          </span>
        )}
      </p>

      {/* option axes */}
      {product.options.map((axis) => {
        const isColor = axis.name === "Color" || axis.name === "Fish Color";
        return (
          <fieldset key={axis.name}>
            <legend className="mb-2 font-sans text-sm font-bold text-ink-800">
              {axis.name}:{" "}
              <span className="font-normal text-ink-600">{selection[axis.name]}</span>
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={axis.name}>
              {axis.values.map((value) => {
                const active = selection[axis.name] === value;
                const hex = isColor ? colorHex(value) ?? fishHex(value) : undefined;
                return isColor && hex ? (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={value}
                    title={value}
                    onClick={() => setSelection((s) => ({ ...s, [axis.name]: value }))}
                    className={`h-9 w-9 rounded-full border-2 transition ${
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
                    onClick={() => setSelection((s) => ({ ...s, [axis.name]: value }))}
                    className={`rounded-full border-[1.5px] px-3.5 py-1.5 font-display text-[0.9rem] font-semibold transition ${
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

      {/* personalization */}
      {(product.customSet || product.customSingle) && (
        <div data-personalize className="clay space-y-4 p-4 sm:p-5">
          {product.customSet && (
            <>
              <SixTitlesForm titles={titles} onChange={setTitles} showErrors={showErrors} />
              <div aria-hidden className="mx-auto max-w-xs pt-1">
                <MiniShelf titles={titles.map((t) => t.title)} accent={false} className="w-full opacity-95" label="Preview of your six books" />
                <p className="mt-1 text-center font-sans text-xs text-ink-400">
                  Your shelf so far (spines are a playful preview, not the final covers)
                </p>
              </div>
            </>
          )}
          {product.customSingle && (
            <Field
              label="The book you'd like made"
              htmlFor="single-title"
              error={showErrors && !singleOk ? "Please tell us the book title." : undefined}
              hint="Add the author or edition in the notes if it helps."
            >
              <input
                id="single-title"
                type="text"
                value={singleTitle}
                required
                onChange={(e) => setSingleTitle(e.target.value)}
                placeholder="e.g. Howl's Moving Castle"
                className={inputClass}
              />
            </Field>
          )}
          <Field
            label="Notes for the studio (optional)"
            htmlFor="config-notes"
            hint="Preferred editions, cover links, gift note, anything that helps."
          >
            <textarea
              id="config-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </div>
      )}

      {/* qty + add */}
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} />
        <Button
          onClick={handleAdd}
          disabled={!canBuy}
          className="flex-1 !py-3.5 text-lg sm:flex-none sm:!px-9"
          aria-disabled={!canBuy}
        >
          <IconBasket className="h-5 w-5" />
          {added ? "Added!" : canBuy ? "Add to basket" : "Sold out, back soon"}
        </Button>
      </div>
      {!canBuy && (
        <p className="font-sans text-sm text-ink-600">
          This little thing is resting between batches. It isn't gone for good. Check
          back soon, or <a href="/contact" className="font-bold text-sage-700 underline">ask us</a> when
          it returns.
        </p>
      )}
      {needsTitles && !titlesOk && showErrors && (
        <p className="font-sans text-sm font-bold text-rose-600" role="alert">
          A custom set needs all {SET_SIZE} titles before it can join your basket.
        </p>
      )}
    </div>
  );
}

function fishHex(value: string): string | undefined {
  return (
    {
      Orange: "#e8a06c",
      White: "#f5f2ec",
      Black: "#3a3a3c",
      Yellow: "#e9c46a",
      "Ivory Cream": "#f1e9da",
      "Oat Beige": "#d9c9ae",
      "Dusty Rose": "#ce9490",
    } as Record<string, string>
  )[value];
}
