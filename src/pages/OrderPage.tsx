import { useCallback, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { cancelOrder, getOrder } from "../api/orders";
import { StatusBadge } from "../components/StatusBadge";
import { cartErrorMessage, errorMessage } from "../lib/errors";
import { formatDateTime } from "../lib/dates";
import { formatCents } from "../lib/money";
import { ORDER_REFRESH_MS, usePoll } from "../lib/usePoll";
import type { Order } from "../types/orders";

export function OrderPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const placed =
    (location.state as { placed?: boolean } | null)?.placed === true;

  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await getOrder(id));
      setLoadError(null);
    } catch (caught) {
      setLoadError(errorMessage(caught));
    }
  }, [id]);

  usePoll(load, ORDER_REFRESH_MS);

  async function cancel() {
    setCancelling(true);
    setActionError(null);
    try {
      setOrder(await cancelOrder(id));
    } catch (caught) {
      setActionError(cartErrorMessage(caught));
      await load();
    } finally {
      setCancelling(false);
    }
  }

  if (!order) {
    return loadError ?
        <p
          role="alert"
          className="text-red-700"
        >
          {loadError}
        </p>
      : <p className="text-stone-600">Loading order…</p>;
  }

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/orders"
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        Back to my orders
      </Link>

      {placed && (
        <p
          role="status"
          className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100"
        >
          Thanks! Your order was placed.
        </p>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
          <p className="text-sm text-stone-600">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100">
        {order.items.map(item => (
          <li
            key={item.id}
            className="flex justify-between gap-3 p-4"
          >
            <div className="space-y-1">
              <p className="font-medium">
                {item.quantity} × {item.name}
              </p>
              <p className="text-sm text-stone-600">
                {formatCents(item.unitPriceCents)} each, price paid
              </p>
              {item.notes && (
                <p className="text-sm text-stone-600">Note: {item.notes}</p>
              )}
            </div>
            <span className="font-semibold">
              {formatCents(item.subtotalCents)}
            </span>
          </li>
        ))}
      </ul>

      <p className="flex justify-between rounded-2xl bg-white p-4 text-lg font-semibold shadow-sm ring-1 ring-stone-100">
        <span>Total</span>
        <span className="text-brand-600">{formatCents(order.totalCents)}</span>
      </p>

      {order.notes && (
        <p className="text-sm text-stone-600">Notes: {order.notes}</p>
      )}

      {actionError && (
        <p
          role="alert"
          className="text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {order.status === "PENDING" && (
        <button
          type="button"
          disabled={cancelling}
          onClick={() => void cancel()}
          className="rounded-xl px-4 py-2.5 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:text-stone-400"
        >
          {cancelling ? "Cancelling…" : "Cancel order"}
        </button>
      )}
    </article>
  );
}
