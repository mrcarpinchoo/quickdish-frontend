import { ORDER_STATUS_LABELS, type OrderStatus } from "../types/orders";

const TONES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  IN_PREPARATION: "bg-sky-100 text-sky-800",
  READY: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-stone-200 text-stone-800",
  CANCELLED: "bg-red-100 text-red-800"
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
