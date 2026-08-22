"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { ButtonLink, Section } from "@/components/ui";
import { IconCheck, IconX } from "@/components/icons";

type Status = "verifying" | "paid" | "pending" | "failed" | "cancelled" | "missing";

function ResultInner() {
  const params = useSearchParams();
  const orderNumber = params.get("order") ?? "";
  const { clearCart } = useCart();
  const [status, setStatus] = useState<Status>(orderNumber ? "verifying" : "missing");
  const attempts = useRef(0);
  const cleared = useRef(false);

  useEffect(() => {
    if (!orderNumber) return;
    let cancelled = false;

    const check = async () => {
      attempts.current += 1;
      try {
        const res = await fetch(`/api/payments/verify?order=${encodeURIComponent(orderNumber)}`);
        if (res.status === 404) {
          if (!cancelled) setStatus("missing");
          return;
        }
        const json = (await res.json()) as { status?: Status };
        if (cancelled) return;
        const s = (json.status ?? "pending") as Status;
        if (s === "paid" && !cleared.current) {
          cleared.current = true;
          clearCart(); // only a verified payment empties the basket
        }
        if (s === "pending" && attempts.current < 5) {
          setStatus("verifying");
          setTimeout(check, 2000);
        } else {
          setStatus(s);
        }
      } catch {
        if (!cancelled) {
          if (attempts.current < 5) setTimeout(check, 2500);
          else setStatus("pending");
        }
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, clearCart]);

  const shell = (icon: React.ReactNode, title: string, body: React.ReactNode, actions: React.ReactNode) => (
    <Section className="pb-nav pt-12">
      <div className="clay mx-auto max-w-lg p-8 text-center">
        {icon}
        <h1 className="mt-4 font-display text-[1.7rem] font-bold leading-tight">{title}</h1>
        <div className="mt-2 font-sans text-[0.98rem] leading-relaxed text-ink-600">{body}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>
        {orderNumber && (
          <p className="mt-5 font-sans text-xs text-ink-400">Order reference: {orderNumber}</p>
        )}
      </div>
    </Section>
  );

  if (status === "verifying") {
    return shell(
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-200">
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-taupe-300 border-t-sage-600" aria-hidden />
      </div>,
      "Checking with the payment provider…",
      <p role="status">
        One moment. We confirm every payment on the server before your order counts.
        This usually takes a few seconds.
      </p>,
      null,
    );
  }

  if (status === "paid") {
    return shell(
      <div className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-sage-600 text-cream-50">
        <IconCheck className="h-8 w-8" />
      </div>,
      "Paid and on the workbench 🎉",
      <p>
        Your payment is verified and your order is in. A confirmation email is on its
        way to you, and the studio has the full details: six titles, colors, notes and all.
      </p>,
      <>
        <ButtonLink href={`/order/${orderNumber}`}>View my order</ButtonLink>
        <ButtonLink href="/shop" variant="quiet">
          Keep browsing
        </ButtonLink>
      </>,
    );
  }

  if (status === "cancelled") {
    return shell(
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-ink-600">
        <IconX className="h-7 w-7" />
      </div>,
      "Payment cancelled, no charge",
      <p>
        You stepped away before paying, which is completely fine. Your basket is exactly
        as you left it whenever you're ready.
      </p>,
      <>
        <ButtonLink href="/checkout">Try checkout again</ButtonLink>
        <ButtonLink href="/cart" variant="quiet">
          Back to my basket
        </ButtonLink>
      </>,
    );
  }

  if (status === "failed") {
    return shell(
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-300/50 text-rose-700">
        <IconX className="h-7 w-7" />
      </div>,
      "The payment didn't go through",
      <p>
        The provider couldn't complete that payment. Cards are moody sometimes. You
        weren't charged, and your basket is safe. Trying again usually does it.
      </p>,
      <>
        <ButtonLink href="/checkout">Try again</ButtonLink>
        <ButtonLink href="/contact" variant="quiet">
          Get help
        </ButtonLink>
      </>,
    );
  }

  if (status === "pending") {
    return shell(
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sun-200 text-brown-700">
        <span className="font-display text-2xl font-bold">…</span>
      </div>,
      "Still confirming your payment",
      <p>
        The provider hasn't confirmed this payment yet. If you completed it, it usually
        settles within a minute. Refresh this page, or check the order page a little
        later. If you didn't pay, no charge was made.
      </p>,
      <>
        <ButtonLink href={`/checkout/result?order=${orderNumber}&from=refresh`}>Check again</ButtonLink>
        <ButtonLink href={`/order/${orderNumber}`} variant="quiet">
          Order page
        </ButtonLink>
      </>,
    );
  }

  return shell(
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-ink-600">
      <IconX className="h-7 w-7" />
    </div>,
    "We can't find that order",
    <p>
      The link may be incomplete. If you just paid for something, check your email for
      the confirmation, or <Link className="font-bold text-sage-700 underline" href="/contact">write to us</Link> and
      we'll track it down.
    </p>,
    <ButtonLink href="/shop" variant="quiet">
      Back to the shop
    </ButtonLink>,
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <Section className="pb-nav pt-12">
          <p className="text-center font-sans text-ink-600" role="status">
            Loading…
          </p>
        </Section>
      }
    >
      <ResultInner />
    </Suspense>
  );
}
