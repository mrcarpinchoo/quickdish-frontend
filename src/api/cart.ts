import type { Cart } from "../types/cart";
import { apiRequest } from "./client";

// Contract from quickdish-api#6, no /api prefix. Every route needs a token.
// Mutations answer with the whole updated cart, so the UI never recomputes totals.

export function getCart() {
  return apiRequest<Cart>("/cart");
}

export function addCartItem(productId: string, quantity = 1) {
  return apiRequest<Cart>("/cart/items", {
    method: "POST",
    body: { productId, quantity }
  });
}

export function updateCartItem(itemId: string, input: { quantity: number }) {
  return apiRequest<Cart>(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: input
  });
}

export function removeCartItem(itemId: string) {
  return apiRequest<Cart>(`/cart/items/${itemId}`, { method: "DELETE" });
}

export function clearCart() {
  return apiRequest<void>("/cart", { method: "DELETE" });
}
