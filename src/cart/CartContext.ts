import { createContext } from "react";
import type { Cart } from "../types/cart";

/** What the customer chooses before a dish goes to the cart. */
export type AddChoices = {
  quantity: number;
  size?: string;
};

export type CartState = {
  /** The account cart from the API. Null for anonymous visitors and until the first load. */
  cart: Cart | null;
  /** Total units across all items, for the header counter. */
  itemCount: number;
  /** Reloads the account cart. Does nothing without a session. */
  refresh: () => Promise<void>;
  /** Adds a dish with the customer's choices. The caller must be signed in. */
  addItem: (productId: string, choices: AddChoices) => Promise<void>;
  /** Sets the quantity of one cart item. Mutations throw ApiError on failure. */
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const CartContext = createContext<CartState | null>(null);
