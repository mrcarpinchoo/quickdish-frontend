import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { createOrder } from "../api/orders";
import { useCart } from "../cart/useCart";
import { cartErrorMessage } from "../lib/errors";
import { formatCents } from "../lib/money";
import { MAX_QUANTITY, type CartItem } from "../types/cart";

export function CartPage() {
  const { cart, refresh, setQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();

  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refresh().catch(caught => setLoadError(cartErrorMessage(caught)));
  }, [refresh]);

  /** Runs one cart change. On failure, shows the message and reloads the cart. */
  async function run(action: () => Promise<void>) {
    setActionError(null);
    setBusy(true);
    try {
      await action();
    } catch (caught) {
      setActionError(cartErrorMessage(caught));
      await refresh().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setBusy(true);
    try {
      const order = await createOrder("");
      await refresh().catch(() => undefined);
      void navigate(`/orders/${order.id}`, { state: { placed: true } });
    } catch (caught) {
      setActionError(cartErrorMessage(caught));
      await refresh().catch(() => undefined);
      setBusy(false);
    }
  }

  if (!cart) {
    return loadError ?
        <p
          role="alert"
          className="text-red-700"
        >
          {loadError}
        </p>
      : <p className="text-stone-600">Loading your cart…</p>;
  }

  if (cart.items.length === 0) {
    return (
      <section className="mx-auto max-w-md space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-100">
        <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
        <p className="font-medium text-stone-800">Your cart is empty.</p>
        <p className="text-stone-600">¡Elige algo rico para empezar!</p>
        <Link
          to="/menu"
          className="inline-block rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          Browse the menu
        </Link>
      </section>
    );
  }

  const hasUnavailable = cart.items.some(item => !item.product.available);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
          <p className="text-sm text-stone-500">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(clear)}
          className="rounded-xl px-3 py-1.5 text-sm font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-white disabled:text-stone-400"
        >
          Empty cart
        </button>
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="space-y-3">
          {cart.items.map(item => (
            <CartRow
              key={item.id}
              item={item}
              disabled={busy}
              onIncrease={() =>
                void run(() => setQuantity(item.id, item.quantity + 1))
              }
              onDecrease={() =>
                void run(() => setQuantity(item.id, item.quantity - 1))
              }
              onRemove={() => void run(() => removeItem(item.id))}
            />
          ))}
        </ul>

        <aside className="h-fit space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100 lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold">Order summary</h2>

          <div className="flex justify-between border-b border-stone-100 pb-4 text-lg font-semibold">
            <span>Total</span>
            <span className="text-brand-600">
              {formatCents(cart.totalCents)}
            </span>
          </div>

          {hasUnavailable && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Remove the dishes marked as unavailable to continue.
            </p>
          )}

          <form onSubmit={event => void placeOrder(event)}>
            <button
              type="submit"
              disabled={busy || hasUnavailable}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:bg-stone-300 disabled:text-stone-600"
            >
              {busy ? "Placing order…" : "Place order"}
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}

type CartRowProps = {
  item: CartItem;
  disabled: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

function CartRow({
  item,
  disabled,
  onIncrease,
  onDecrease,
  onRemove
}: CartRowProps) {
  const { product, quantity } = item;
  return (
    <li className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
      <div
        aria-hidden="true"
        className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-stone-100 text-2xl text-stone-400"
      >
        {product.name.charAt(0)}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-between gap-3">
          <h2 className="font-semibold">{product.name}</h2>
          <span className="font-semibold">
            {formatCents(item.subtotalCents)}
          </span>
        </div>
        <p className="text-sm text-stone-600">
          {formatCents(product.priceCents)} each
        </p>
        {item.notes && <p className="text-sm text-stone-600">{item.notes}</p>}
        {!product.available && (
          <p className="text-sm text-red-700">
            Not available right now. Remove it to continue.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Decrease quantity of ${product.name}`}
              disabled={disabled || quantity <= 1}
              onClick={onDecrease}
              className="h-8 w-8 rounded-lg ring-1 ring-stone-200 hover:bg-stone-100 disabled:text-stone-300"
            >
              −
            </button>
            <span
              aria-label={`Quantity of ${product.name}`}
              className="w-8 text-center"
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${product.name}`}
              disabled={disabled || quantity >= MAX_QUANTITY}
              onClick={onIncrease}
              className="h-8 w-8 rounded-lg ring-1 ring-stone-200 hover:bg-stone-100 disabled:text-stone-300"
            >
              +
            </button>
          </div>
          <button
            type="button"
            aria-label={`Remove ${product.name}`}
            disabled={disabled}
            onClick={onRemove}
            className="text-sm font-medium text-red-600 hover:underline disabled:text-stone-400"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
