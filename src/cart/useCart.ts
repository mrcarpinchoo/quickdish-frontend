import { useContext } from "react";
import { CartContext, type CartState } from "./CartContext";

export function useCart(): CartState {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return value;
}
