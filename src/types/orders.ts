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

/** Order as the admin panel gets it: who ordered it, too (#25). */
export type AdminOrder = Order & {
  customer: { id: string; name: string; email: string };
};

/** The statuses the admin board shows as columns, in order. */
export const BOARD_STATUSES = [
  "PENDING",
  "IN_PREPARATION",
  "READY",
  "DELIVERED"
] as const satisfies readonly OrderStatus[];

/** The status an order moves to when the admin presses "Advance". */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "IN_PREPARATION",
  IN_PREPARATION: "READY",
  READY: "DELIVERED"
};
