import type { AdminOrder, OrderStatus } from "../types/orders";
import { apiRequest } from "./client";

// Contract from quickdish-api#25, no /api prefix. Admin token required.

export function listAllOrders() {
  return apiRequest<AdminOrder[]>("/orders");
}

/** Moves an order one step forward. Other moves answer 400 INVALID_STATUS_TRANSITION. */
export function advanceOrder(id: string, status: OrderStatus) {
  return apiRequest<AdminOrder>(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status }
  });
}
