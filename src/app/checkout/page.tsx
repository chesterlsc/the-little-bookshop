"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { Button, ButtonLink, Eyebrow, Field, inputClass, Section } from "@/components/ui";
import { FREE_SHIPPING_MINIMUM, cartCount, cartSubtotal, describeLine, shippingFor, validateCart } from "@/lib/cart";
import { EMPTY_CUSTOMER, validateCustomer, type CustomerInfo, type FieldErrors } from "@/lib/checkout";
import { formatMoney } from "@/lib/money";
import { IconCheck } from "@/components/icons";

const FIELDS: {
  key: keyof CustomerInfo;
  label: string;
  autoComplete: string;
  type?: string;
  half?: boolean;
  optional?: boolean;
}[] = [
  { key: "fullName", label: "Full name", autoComplete: "name" },
  { key: "email", label: "Email address", autoComplete: "email", type: "email" },
  { key: "phone", label: "Phone number", autoComplete: "tel", type: "tel" },
  { key: "address1", label: "Street address", autoComplete: "address-line1" },
  { key: "address2", label: "Apartment, unit, etc. (optional)", autoComplete: "address-line2", optional: true },
  { key: "city", label: "City", autoComplete: "address-level2", half: true },
  { key: "region", label: "State / province (optional)", autoComplete: "address-level1", half: true, optional: true },
  { key: "postalCode", label: "Postal code", autoComplete: "postal-code", half: true },
  { key: "country", label: "Country", autoComplete: "country-name", half: true },
];

export default function CheckoutPage() {
  const { cart, ready } = useCart();
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [cartIssues, setCartIssues] = useState<{ key: string; message: string }[]>([]);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cartSubtotal(cart);
  const shipping = shippingFor(subtotal);
  const localIssues = ready ? validateCart(cart) : [];

  const set = (key: keyof CustomerInfo, value: string) =>
    setCustomer((c) => ({ ...c, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMessage(null);
    const fieldErrors = validateCustomer(customer);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) {
      document.getElementById(`field-${Object.keys(fieldErrors)[0]}`)?.focus();
      return;
    }
    if (localIssues.length) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, customer }),
      });
      const json = await res.json();
      if (res.ok && json.redirectUrl) {
        // hold the basket until the payment is verified; the result page clears it
        window.location.assign(json.redirectUrl);
        return;
      }
      if (json.fieldErrors) setErrors(json.fieldErrors);
      else if (json.issues) setCartIssues(json.issues);
      else setServerMessage(json.message ?? "Something went wrong and nothing was charged. Please try again.");
      setSubmitting(false);
    } catch {
      setServerMessage("We couldn't reach the shop just now. Nothing was charged. Please try again.");
      setSubmitting(false);
    }
  };

  if (ready && cart.lines.length === 0) {
    return (
      <Section className="pb-nav pt-12">
        <div className="clay mx-auto max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Nothing to check out yet</h1>
          <p className="mt-2 font-sans text-[0.95rem] text-ink-600">
            Your basket is empty. Six tiny books would fix that.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <ButtonLink href="/build">Build a shelf</ButtonLink>
            <ButtonLink href="/shop" variant="quiet">
              Browse the shop
            </ButtonLink>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <div className="pb-nav">
      <Section className="pt-8">
        <div className="mb-6 text-center">
          <Eyebrow className="mb-2">Checkout</Eyebrow>
          <h1 className="text-3xl font-bold sm:text-4xl">Nearly on your shelf</h1>
          <p className="mx-auto mt-2 max-w-[48ch] font-sans text-[0.95rem] text-ink-600">
            Guest checkout, no account needed. Payment happens on a secure hosted page;
            your card details never touch our shop.
          </p>
        </div>

        <form onSubmit={submit} noValidate className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="clay p-5 sm:p-6">
            <h2 className="mb-4 font-display text-xl font-bold">Where should the tiny things go?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  htmlFor={`field-${f.key}`}
                  error={errors[f.key]}
                  className={f.half ? "" : "sm:col-span-2"}
                >
                  <input
                    id={`field-${f.key}`}
                    type={f.type ?? "text"}
                    value={customer[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    autoComplete={f.autoComplete}
                    required={!f.optional}
                    aria-invalid={errors[f.key] ? true : undefined}
                    className={`${inputClass} ${errors[f.key] ? "!border-rose-500" : ""}`}
                  />
                </Field>
              ))}
              <Field
                label="Delivery notes (optional)"
                htmlFor="field-deliveryNotes"
                hint="Gate codes, 'leave with the neighbor', that sort of thing."
                error={errors.deliveryNotes}
                className="sm:col-span-2"
              >
                <textarea
                  id="field-deliveryNotes"
                  value={customer.deliveryNotes}
                  onChange={(e) => set("deliveryNotes", e.target.value)}
                  rows={2}
                  maxLength={500}
                  className={`${inputClass} resize-y`}
                />
              </Field>
              <Field
                label="Order notes (optional)"
                htmlFor="field-orderNotes"
                hint="A gift message, or anything else the studio should know."
                error={errors.orderNotes}
                className="sm:col-span-2"
              >
                <textarea
                  id="field-orderNotes"
                  value={customer.orderNotes}
                  onChange={(e) => set("orderNotes", e.target.value)}
                  rows={2}
                  maxLength={500}
                  className={`${inputClass} resize-y`}
                />
              </Field>
            </div>
          </div>

          <aside className="clay sticky top-24 p-5" aria-label="Order summary">
            <h2 className="font-display text-lg font-bold">
              Your order{" "}
              <span className="font-sans text-sm font-bold text-ink-600">
                · {cartCount(cart)} {cartCount(cart) === 1 ? "item" : "items"}
              </span>
            </h2>
            <ul className="mt-3 space-y-2 border-b border-brown-500/10 pb-3">
              {cart.lines.map((line) => (
                <li key={line.key} className="flex justify-between gap-3 font-sans text-[0.9rem]">
                  <span className="text-ink-600">
                    {describeLine(line)} <span className="text-ink-400">× {line.qty}</span>
                  </span>
                </li>
              ))}
            </ul>
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

            {(localIssues.length > 0 || cartIssues.length > 0) && (
              <div className="stitch mt-4 bg-blush-100/60 p-3" role="alert">
                <p className="font-sans text-sm font-bold text-rose-700">Before payment:</p>
                <ul className="mt-1 list-disc pl-4 font-sans text-sm text-rose-700">
                  {[...localIssues, ...cartIssues].map((i, n) => (
                    <li key={n}>{i.message}</li>
                  ))}
                </ul>
                <Link href="/cart" className="mt-1 inline-block font-sans text-sm font-bold text-rose-700 underline">
                  Fix it in the basket
                </Link>
              </div>
            )}
            {serverMessage && (
              <p className="stitch mt-4 bg-blush-100/60 p-3 font-sans text-sm font-bold text-rose-700" role="alert">
                {serverMessage}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting || localIssues.length > 0}
              className="mt-4 w-full !py-3.5 text-lg"
            >
              {submitting ? "Opening secure payment…" : "Continue to secure payment"}
            </Button>
            <ul className="mt-3 space-y-1 font-sans text-xs text-ink-600">
              {[
                "Payment on the provider's secure page",
                "We never see or store card details",
                "Order confirmed only after verified payment",
              ].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <IconCheck className="h-3.5 w-3.5 shrink-0 text-sage-600" /> {t}
                </li>
              ))}
            </ul>
          </aside>
        </form>
      </Section>
    </div>
  );
}
