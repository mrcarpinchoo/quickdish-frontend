import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem
} from "../api/cart";
import { useAuth } from "../auth/useAuth";
import type { Cart } from "../types/cart";
import { CartContext, type CartState } from "./CartContext";

/** Keeps the cart in sync with the API for the signed-in customer. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);

  const refresh = useCallback(async () => {
    setCart(await getCart());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let current = true;
    getCart()
      .then(loaded => {
        if (current) setCart(loaded);
      })
      .catch(() => {
        // The header counter stays empty; pages show their own errors.
      });
    return () => {
      current = false;
    };
  }, [isAuthenticated]);

  // Signing out clears the cart in the same render, so nothing leaks to the next user.
  const visibleCart = isAuthenticated ? cart : null;

  const value = useMemo<CartState>(() => {
    const apply = (next: Cart) => setCart(next);
    return {
      cart: visibleCart,
      itemCount:
        visibleCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
      refresh,
      addItem: async productId => apply(await addCartItem(productId)),
      setQuantity: async (itemId, quantity) =>
        apply(await updateCartItem(itemId, { quantity })),
      removeItem: async itemId => apply(await removeCartItem(itemId)),
      clear: async () => {
        await clearCart();
        await refresh();
      }
    };
  }, [visibleCart, refresh]);

  return <CartContext value={value}>{children}</CartContext>;
}
