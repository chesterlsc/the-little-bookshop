"use client";

import { useEffect } from "react";
import { useCart } from "./cart-context";

/**
 * One-shot marker written by the checkout redirect, naming the order it created.
 * PayScreen consumes it, so the basket empties only in the browser that just
 * placed that order — the pay page is bookmarkable and forwardable, and an
 * unconditional clear would wipe an unrelated in-progress basket.
 */
export const CLEAR_CART_KEY = "tlb-clear-cart";

/**
 * The same hand-off for an order that never sees the payment page: one a gift
 * card paid for in full lands straight on its order page.
 */
export function ClearCartOnMount({ orderNumber }: { orderNumber: string }) {
  const { ready, cart, clearCart } = useCart();
  useEffect(() => {
    if (!ready) return;
    try {
      if (sessionStorage.getItem(CLEAR_CART_KEY) !== orderNumber) return;
      sessionStorage.removeItem(CLEAR_CART_KEY);
    } catch {
      return;
    }
    if (cart.lines.length) clearCart();
  }, [ready, orderNumber, cart.lines.length, clearCart]);
  return null;
}
