import { useCallback, useState } from "react";
import { advanceOrder, listAllOrders } from "../api/admin-orders";
import { StatusBadge } from "../components/StatusBadge";
import { errorMessage } from "../lib/errors";
import { formatDateTime } from "../lib/dates";
import { formatCents } from "../lib/money";
import { ADMIN_REFRESH_MS, usePoll } from "../lib/usePoll";
import {
  BOARD_STATUSES,
  NEXT_STATUS,
  ORDER_STATUS_LABELS,
  type AdminOrder,
  type OrderStatus
} from "../types/orders";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrders(await listAllOrders());
      setLoadError(null);
    } catch (caught) {
      setLoadError(errorMessage(caught));
    }
  }, []);

  usePoll(load, ADMIN_REFRESH_MS);

  async function advance(order: AdminOrder) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    setAdvancing(order.id);
    setActionError(null);
    try {
      const updated = await advanceOrder(order.id, next);
      setOrders(
        current =>
          current?.map(o => (o.id === updated.id ? updated : o)) ?? current
      );
    } catch (caught) {
      // The API explains why (for example, the order was already moved).
      setActionError(errorMessage(caught));
      await load();
    } finally {
      setAdvancing(null);
    }
  }

  const cancelled = orders?.filter(order => order.status === "CANCELLED") ?? [];

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>

      {orders === null && !loadError && (
        <p className="text-stone-600">Loading orders…</p>
      )}

      {loadError && (
        <p
          role="alert"
          className="text-red-700"
        >
          {loadError}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BOARD_STATUSES.map(status => (
          <Column
            key={status}
            status={status}
            orders={orders?.filter(order => order.status === status) ?? []}
            advancing={advancing}
            onAdvance={order => void advance(order)}
          />
        ))}
      </div>

      {cancelled.length > 0 && (
        <p className="text-sm text-stone-600">
          Cancelled by customers: {cancelled.length}
        </p>
      )}
    </section>
  );
}

type ColumnProps = {
  status: OrderStatus;
  orders: AdminOrder[];
  advancing: string | null;
  onAdvance: (order: AdminOrder) => void;
};

function Column({ status, orders, advancing, onAdvance }: ColumnProps) {
  return (
    <section
      aria-label={ORDER_STATUS_LABELS[status]}
      className="flex flex-col gap-3 rounded-lg bg-stone-100 p-3"
    >
      <h2 className="flex items-center justify-between text-sm font-semibold">
        {ORDER_STATUS_LABELS[status]}
        <span className="text-stone-500">{orders.length}</span>
      </h2>

      {orders.length === 0 && (
        <p className="text-sm text-stone-500">No orders.</p>
      )}

      {orders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          busy={advancing === order.id}
          onAdvance={() => onAdvance(order)}
        />
      ))}
    </section>
  );
}

type OrderCardProps = {
  order: AdminOrder;
  busy: boolean;
  onAdvance: () => void;
};

function OrderCard({ order, busy, onAdvance }: OrderCardProps) {
  const next = NEXT_STATUS[order.status];

  return (
    <article
      aria-label={`Order ${order.id.slice(0, 8)}`}
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
          <p className="text-xs text-stone-500">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="text-sm">
        <p className="font-medium">{order.customer.name}</p>
        <p className="text-stone-600">{order.customer.email}</p>
      </div>

      <ul className="space-y-1 text-sm">
        {order.items.map(item => (
          <li key={item.id}>
            {item.quantity} × {item.name}
            {item.notes && (
              <span className="block text-stone-500">Note: {item.notes}</span>
            )}
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="text-sm text-stone-600">Order notes: {order.notes}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{formatCents(order.totalCents)}</span>
        {next && (
          <button
            type="button"
            disabled={busy}
            onClick={onAdvance}
            className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:bg-stone-300"
          >
            {busy ? "Advancing…" : "Advance"}
          </button>
        )}
      </div>
    </article>
  );
}
