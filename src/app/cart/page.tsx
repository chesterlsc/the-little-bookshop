"use client";

import { useCart } from "@/components/cart-context";
import { CartEmpty, CartLineRow } from "@/components/cart-ui";
import { ButtonLink, Eyebrow, Section } from "@/components/ui";
import { FREE_SHIPPING_MINIMUM, cartCount, cartSubtotal, shippingFor, validateCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

export default function CartPage() {
  const { cart, ready } = useCart();
  const count = cartCount(cart);
  const subtotal = cartSubtotal(cart);
  const shipping = shippingFor(subtotal);
  const issues = ready ? validateCart(cart).filter((i) => i.key) : [];

  return (
    <div className="pb-nav">
      <Section className="pt-8">
        <div className="mb-6 text-center">
          <Eyebrow className="mb-2">Your basket</Eyebrow>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {count > 0 ? `${count} tiny ${count === 1 ? "thing" : "things"} so far` : "Your basket"}
          </h1>
        </div>

        {!ready ? (
          <p className="py-16 text-center font-sans text-ink-600" role="status">
            Opening your basket…
          </p>
        ) : cart.lines.length === 0 ? (
          <div className="clay mx-auto max-w-md p-6">
            <CartEmpty />
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="clay px-5 py-2">
              <ul className="divide-y divide-brown-500/10">
                {cart.lines.map((line) => (
                  <CartLineRow key={line.key} line={line} />
                ))}
              </ul>
            </div>

            <aside className="clay sticky top-24 p-5" aria-label="Order summary">
              <h2 className="font-display text-lg font-bold">Little sum</h2>
              <dl className="mt-3 space-y-2 font-sans text-[0.95rem]">
                <div className="flex justify-between">
                  <dt className="text-ink-600">Subtotal</dt>
                  <dd className="font-bold">{formatMoney(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-600">Shipping</dt>
                  <dd className="font-bold">
                    {shipping === 0 ? "Free" : formatMoney(shipping)}
                  </dd>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-ink-600">
                    Add {formatMoney(FREE_SHIPPING_MINIMUM - subtotal)} more for free shipping.
                  </p>
                )}
                <div className="flex justify-between border-t border-brown-500/15 pt-2 text-[1.05rem]">
                  <dt className="font-display font-bold">Total</dt>
                  <dd className="font-display font-bold">{formatMoney(subtotal + shipping)}</dd>
                </div>
              </dl>

              {issues.length > 0 && (
                <div className="stitch mt-4 bg-blush-100/60 p-3" role="alert">
                  <p className="font-sans text-sm font-bold text-rose-700">
                    Before checkout:
                  </p>
                  <ul className="mt-1 list-disc pl-4 font-sans text-sm text-rose-700">
                    {issues.map((i, n) => (
                      <li key={n}>{i.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <ButtonLink
                href="/checkout"
                className="mt-4 w-full !py-3.5 text-lg"
                aria-disabled={issues.length > 0}
                onClick={(e) => {
                  if (issues.length > 0) e.preventDefault();
                }}
              >
                Go to checkout
              </ButtonLink>
              <p className="mt-2 text-center font-sans text-xs text-ink-400">
                No card needed — you&apos;ll pay by GCash or MariBank on the next screen.
              </p>
              <ButtonLink href="/shop" variant="quiet" className="mt-2 w-full">
                Keep browsing
              </ButtonLink>
            </aside>
          </div>
        )}
      </Section>
    </div>
  );
}
