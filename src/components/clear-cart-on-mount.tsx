/**
 * One-shot marker written by the checkout redirect, naming the order it created.
 * PayScreen consumes it, so the basket empties only in the browser that just
 * placed that order — the pay page is bookmarkable and forwardable, and an
 * unconditional clear would wipe an unrelated in-progress basket.
 */
export const CLEAR_CART_KEY = "tlb-clear-cart";
