import { useCallback, useState } from "react";
import { Link } from "react-router";
import { listMyOrders } from "../api/orders";
import { StatusBadge } from "../components/StatusBadge";
import { errorMessage } from "../lib/errors";
import { formatDateTime } from "../lib/dates";
import { formatCents } from "../lib/money";
import { ORDER_REFRESH_MS, usePoll } from "../lib/usePoll";
import type { Order } from "../types/orders";

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrders(await listMyOrders());
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, []);

  usePoll(load, ORDER_REFRESH_MS);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>

      {error && (
        <p
          role="alert"
          className="text-red-700"
        >
          {error}
        </p>
      )}

      {orders === null && !error && (
        <p className="text-stone-600">Loading your orders…</p>
      )}

      {orders?.length === 0 && (
        <p className="text-stone-600">
          You have no orders yet.{" "}
          <Link
            to="/menu"
            className="font-medium text-brand-700 hover:underline"
          >
            Browse the menu
          </Link>
        </p>
      )}

      {orders && orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map(order => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100 transition-shadow hover:shadow-md"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-sm text-stone-600">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="font-semibold">
                    {formatCents(order.totalCents)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
