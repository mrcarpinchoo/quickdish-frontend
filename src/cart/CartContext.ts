import { createContext } from "react";
import type { Cart } from "../types/cart";

export type CartState = {
  /** null until the first load, and always null for anonymous visitors. */
  cart: Cart | null;
  /** Total units across all items, for the header counter. */
  itemCount: number;
  /** Mutations throw ApiError on failure, so the caller can show the message. */
  refresh: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const CartContext = createContext<CartState | null>(null);
