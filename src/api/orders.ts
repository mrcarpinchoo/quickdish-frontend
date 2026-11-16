import type { Order } from "../types/orders";
import { apiRequest } from "./client";

// Contract from quickdish-api#6, no /api prefix. Every route needs a token.

/** Turns the cart into a PENDING order. Empty cart → 400, unavailable dish → 409. */
export function createOrder(notes: string) {
  return apiRequest<Order>("/orders", {
    method: "POST",
    body: { notes: notes.trim() === "" ? null : notes.trim() }
  });
}

export function listMyOrders() {
  return apiRequest<Order[]>("/orders/mine");
}

export function getOrder(id: string) {
  return apiRequest<Order>(`/orders/${id}`);
}

/** Only while the order is PENDING; otherwise the API answers 409. */
export function cancelOrder(id: string) {
  return apiRequest<Order>(`/orders/${id}/cancel`, { method: "POST" });
}
