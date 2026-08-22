"use client";

import { useEffect, useRef } from "react";
import { useCart } from "./cart-context";
import { ProductThumb } from "./product-thumb";
import { IconX, IconTrash, IconBasket } from "./icons";
import { Badge, Button, ButtonLink, QuantityStepper } from "./ui";
import { getProduct, getVariant, SHELF_THEMES, colorHex } from "@/lib/catalog";
import { FREE_SHIPPING_MINIMUM, cartSubtotal, cartCount, lineUnitPrice, type CartLine } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

function OptionSummary({ options }: { options: Record<string, string> }) {
  const entries = Object.entries(options);
  if (!entries.length) return null;
  return (
    <p className="text-xs text-ink-600">
      {entries.map(([k, v], i) => (
        <span key={k}>
          {i > 0 && " · "}
          {k === "Color" && colorHex(v) && (
            <span
              aria-hidden
              className="mr-1 inline-block h-2.5 w-2.5 rounded-full border border-ink-800/30 align-[-1px]"
              style={{ background: colorHex(v) }}
            />
          )}
          {v}
        </span>
      ))}
    </p>
  );
}

function LineArt({ line }: { line: CartLine }) {
  const slug = line.type === "product" ? line.slug : line.shelf.slug;
  const product = getProduct(slug);
  if (!product) return null;
  return (
    <div className="clay-sm h-16 w-16 shrink-0 overflow-hidden p-1.5">
      <ProductThumb product={product} className="h-full w-full" sizes="64px" />
    </div>
  );
}

export function CartLineRow({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const { updateQty, removeLine } = useCart();
  const unit = lineUnitPrice(line);

  let title = "";
  let body: React.ReactNode = null;

  if (line.type === "product") {
    const product = getProduct(line.slug);
    const variant = product && getVariant(product, line.variantId);
    title = product?.name ?? line.slug;
    body = (
      <>
        {variant && <OptionSummary options={variant.options} />}
        {line.titles && (
          <details className="mt-1">
            <summary className="cursor-pointer text-xs font-bold text-sage-700">
              Six custom titles
            </summary>
            <ol className="mt-1 list-decimal pl-4 text-xs text-ink-600">
              {line.titles.map((t, i) => (
                <li key={i}>
                  {t.title}
                  {t.author ? `, ${t.author}` : ""}
                </li>
              ))}
            </ol>
          </details>
        )}
        {line.singleTitle && (
          <p className="mt-0.5 text-xs text-ink-600">
            Title: <span className="font-bold">{line.singleTitle}</span>
          </p>
        )}
        {line.notes && <p className="mt-0.5 text-xs italic text-ink-400">“{line.notes}”</p>}
      </>
    );
  } else {
    const shelf = getProduct(line.shelf.slug);
    const shelfVar = shelf && getVariant(shelf, line.shelf.variantId);
    const set = getProduct(line.set.slug);
    const setVar = set && getVariant(set, line.set.variantId);
    const theme = SHELF_THEMES.find((t) => t.id === line.themeId);
    title = "Little Shelf Bundle";
    body = (
      <>
        <p className="text-xs text-ink-600">
          {shelf?.name}
          {shelfVar && ` (${Object.values(shelfVar.options).join(", ")})`}
        </p>
        <p className="text-xs text-ink-600">
          {set?.name}
          {setVar && setVar.options["Cover Style"] ? `, ${setVar.options["Cover Style"]}` : ""}
        </p>
        {line.set.titles && (
          <details className="mt-1">
            <summary className="cursor-pointer text-xs font-bold text-sage-700">
              Six custom titles
            </summary>
            <ol className="mt-1 list-decimal pl-4 text-xs text-ink-600">
              {line.set.titles.map((t, i) => (
                <li key={i}>
                  {t.title}
                  {t.author ? `, ${t.author}` : ""}
                </li>
              ))}
            </ol>
          </details>
        )}
        {line.accessories.length > 0 && (
          <p className="text-xs text-ink-600">
            Extras:{" "}
            {line.accessories
              .map((a) => {
                const p = getProduct(a.slug);
                const v = p && getVariant(p, a.variantId);
                const opt = v && Object.values(v.options)[0];
                return p ? `${p.name}${opt ? ` (${opt})` : ""}` : "";
              })
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
        {theme && (
          <Badge tone="blush" className="mt-1">
            {theme.name}
          </Badge>
        )}
        {line.notes && <p className="mt-0.5 text-xs italic text-ink-400">“{line.notes}”</p>}
      </>
    );
  }

  return (
    <li className="flex gap-3 py-3">
      <LineArt line={line} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-[0.98rem] font-semibold leading-snug text-ink-800">{title}</p>
          <p className="whitespace-nowrap font-display font-semibold">{formatMoney(unit * line.qty)}</p>
        </div>
        {body}
        <div className="mt-2 flex items-center justify-between gap-2">
          <QuantityStepper
            small
            value={line.qty}
            onChange={(n) => updateQty(line.key, n)}
            label={`Quantity for ${title}`}
          />
          <button
            type="button"
            onClick={() => removeLine(line.key)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-ink-400 transition hover:bg-blush-100 hover:text-rose-600"
            aria-label={`Remove ${title} from cart`}
          >
            <IconTrash className="h-3.5 w-3.5" /> {!compact && "Remove"}
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartEmpty({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="clay flex h-24 w-24 items-center justify-center rounded-full p-4">
        <IconBasket className="h-10 w-10 text-taupe-500" />
      </div>
      <div>
        <p className="font-display text-lg font-semibold">Your basket is empty</p>
        <p className="mt-1 max-w-[26ch] text-sm text-ink-600">
          Six tiny books and a little shelf would fix that.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <ButtonLink href="/build" onClick={onClose}>
          Build your little shelf
        </ButtonLink>
        <ButtonLink href="/shop" variant="quiet" onClick={onClose}>
          Browse the shop
        </ButtonLink>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, ready } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const count = cartCount(cart);
  const subtotal = cartSubtotal(cart);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    // move focus into the dialog
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Shopping basket">
      <button
        aria-label="Close basket"
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-[2px]"
        onClick={closeDrawer}
      />
      <div
        ref={panelRef}
        className="glass absolute right-0 top-0 flex h-full w-full max-w-md animate-fade-up flex-col rounded-l-3xl lg:animate-none"
        style={{ animationDuration: "0.3s" }}
      >
        <header className="flex items-center justify-between border-b border-brown-500/15 px-5 py-4">
          <h2 className="font-display text-xl font-bold">
            Your basket{" "}
            <span className="ml-1 align-middle font-sans text-sm font-bold text-ink-600">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </h2>
          <button
            type="button"
            data-autofocus
            onClick={closeDrawer}
            className="clay-sm flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition hover:text-ink-800"
            aria-label="Close basket"
          >
            <IconX className="h-4.5 w-4.5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          {!ready || cart.lines.length === 0 ? (
            <CartEmpty onClose={closeDrawer} />
          ) : (
            <ul className="divide-y divide-brown-500/10">
              {cart.lines.map((line) => (
                <CartLineRow key={line.key} line={line} compact />
              ))}
            </ul>
          )}
        </div>

        {cart.lines.length > 0 && (
          <footer className="border-t border-brown-500/15 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-sans text-sm font-bold text-ink-600">Subtotal</span>
              <span className="font-display text-lg font-bold">{formatMoney(subtotal)}</span>
            </div>
            <p className="mb-3 text-xs text-ink-400">
              {subtotal >= FREE_SHIPPING_MINIMUM
                ? "Shipping is free on this order."
                : `Add ${formatMoney(FREE_SHIPPING_MINIMUM - subtotal)} more for free shipping.`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href="/cart" variant="quiet" onClick={closeDrawer}>
                View cart
              </ButtonLink>
              <ButtonLink href="/checkout" onClick={closeDrawer}>
                Checkout
              </ButtonLink>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

export function CartButton({ className = "" }: { className?: string }) {
  const { cart, openDrawer, addPulse, ready } = useCart();
  const count = cartCount(cart);
  return (
    <Button variant="quiet" className={`relative !px-4 ${className}`} onClick={openDrawer} aria-label={`Open basket, ${count} items`}>
      <IconBasket className="h-5 w-5" />
      <span className="hidden sm:inline">Basket</span>
      {ready && count > 0 && (
        <span
          key={addPulse}
          className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 animate-pop items-center justify-center rounded-full bg-rose-500 px-1.5 font-sans text-xs font-black text-cream-50 shadow-sm"
        >
          {count}
        </span>
      )}
    </Button>
  );
}
