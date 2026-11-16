/** Order statuses as the API returns them (#6). Not an enum: erasableSyntaxOnly. */
export type OrderStatus =
  "PENDING" | "IN_PREPARATION" | "READY" | "DELIVERED" | "CANCELLED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  IN_PREPARATION: "In preparation",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  /** Price at the time of purchase, not the dish's current price. */
  unitPriceCents: number;
  subtotalCents: number;
  notes: string | null;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  totalCents: number;
  notes: string | null;
  /** ISO 8601 string, as JSON sends it. */
  createdAt: string;
  items: OrderItem[];
};
