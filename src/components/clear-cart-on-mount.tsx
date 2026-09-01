"use client";

import { useEffect } from "react";
import { useCart } from "./cart-context";

/** One-shot marker written by the checkout redirect, naming the order it created. */
export const CLEAR_CART_KEY = "tlb-clear-cart";

/**
 * Empties the basket once the order exists server-side.
 *
 * Rendered on the payment page rather than at submit time, so a customer who
 * abandons checkout keeps their basket and the checkout never flashes its
 * "nothing to check out yet" state mid-redirect.
 *
 * Only clears when this browser is the one that just placed THIS order: the pay
 * page is bookmarkable, forwardable and guessable, so an unconditional clear
 * would wipe an unrelated in-progress basket.
 */
export function ClearCartOnMount({ orderNumber }: { orderNumber: string }) {
  const { ready, clearCart } = useCart();

  useEffect(() => {
    if (!ready) return;
    try {
      if (sessionStorage.getItem(CLEAR_CART_KEY) !== orderNumber) return;
      sessionStorage.removeItem(CLEAR_CART_KEY); // consumed: refreshes are no-ops
    } catch {
      return; // storage unavailable: keep the basket rather than lose it
    }
    clearCart();
  }, [ready, orderNumber, clearCart]);

  return null;
}
