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
import { sizeNote } from "../lib/dish-options";
import type { Cart } from "../types/cart";
import { CartContext, type CartState } from "./CartContext";

/** Keeps the signed-in customer's cart in sync with the API. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setCart(await getCart());
  }, [isAuthenticated]);

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

  // Anonymous visitors never see an account cart, even before a sign-out clears state.
  const visibleCart = isAuthenticated ? cart : null;

  const value = useMemo<CartState>(
    () => ({
      cart: visibleCart,
      itemCount:
        visibleCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
      refresh,
      addItem: async (productId, choices) => {
        setCart(
          await addCartItem(productId, choices.quantity, sizeNote(choices.size))
        );
      },
      setQuantity: async (itemId, quantity) => {
        setCart(await updateCartItem(itemId, { quantity }));
      },
      removeItem: async itemId => {
        setCart(await removeCartItem(itemId));
      },
      clear: async () => {
        await clearCart();
        await refresh();
      }
    }),
    [visibleCart, refresh]
  );

  return <CartContext value={value}>{children}</CartContext>;
}
