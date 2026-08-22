"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_CART, newLineKey, type Cart, type CartLine, type NewCartLine } from "@/lib/cart";

const STORAGE_KEY = "tlb-cart-v1";

interface CartApi {
  cart: Cart;
  ready: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addLine: (line: NewCartLine) => void;
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  /** increments when something is added; drives the badge pop animation */
  addPulse: number;
}

const CartContext = createContext<CartApi | null>(null);

function loadCart(): Cart {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw) as Cart;
    if (!parsed || !Array.isArray(parsed.lines)) return EMPTY_CART;
    return { lines: parsed.lines.filter((l) => l && typeof l.key === "string") };
  } catch {
    return EMPTY_CART;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addPulse, setAddPulse] = useState(0);
  const skipPersist = useRef(true);

  useEffect(() => {
    setCart(loadCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* storage may be unavailable; the in-memory cart still works */
    }
  }, [cart]);

  const addLine = useCallback((line: NewCartLine) => {
    setCart((prev) => {
      // merge identical simple product lines (same variant, no personalization)
      if (line.type === "product" && !line.titles && !line.singleTitle) {
        const existing = prev.lines.find(
          (l) =>
            l.type === "product" &&
            l.slug === line.slug &&
            l.variantId === line.variantId &&
            !l.titles &&
            !l.singleTitle,
        );
        if (existing) {
          return {
            lines: prev.lines.map((l) =>
              l.key === existing.key ? { ...l, qty: l.qty + (line.qty ?? 1) } : l,
            ),
          };
        }
      }
      const withKey = { ...line, key: line.key ?? newLineKey() } as CartLine;
      return { lines: [...prev.lines, withKey] };
    });
    setAddPulse((n) => n + 1);
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setCart((prev) => ({
      lines:
        qty <= 0
          ? prev.lines.filter((l) => l.key !== key)
          : prev.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 50) } : l)),
    }));
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => ({ lines: prev.lines.filter((l) => l.key !== key) }));
  }, []);

  const clearCart = useCallback(() => setCart(EMPTY_CART), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const api = useMemo<CartApi>(
    () => ({
      cart,
      ready,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addLine,
      updateQty,
      removeLine,
      clearCart,
      addPulse,
    }),
    [cart, ready, drawerOpen, openDrawer, closeDrawer, addLine, updateQty, removeLine, clearCart, addPulse],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
