import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { createOrder } from "../api/orders";
import { useCart } from "../cart/useCart";
import { cartErrorMessage } from "../lib/errors";
import { formatCents } from "../lib/money";
import { MAX_QUANTITY, type CartItem } from "../types/cart";

const NOTES_MAX = 500;

export function CartPage() {
  const { cart, refresh, setQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();

  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");

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
      const order = await createOrder(notes);
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
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Cart</h1>
        <p className="text-stone-600">Your cart is empty.</p>
        <Link
          to="/"
          className="text-orange-700 underline"
        >
          Browse the menu
        </Link>
      </section>
    );
  }

  const hasUnavailable = cart.items.some(item => !item.product.available);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Cart</h1>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(clear)}
          className="rounded-md px-3 py-1 text-sm text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100 disabled:text-stone-400"
        >
          Empty cart
        </button>
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
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

      <p className="flex justify-between text-lg font-semibold">
        <span>Total</span>
        <span>{formatCents(cart.totalCents)}</span>
      </p>

      <form
        className="space-y-3"
        onSubmit={event => void placeOrder(event)}
      >
        <label className="block text-sm font-medium">
          Notes for the kitchen (optional)
          <textarea
            value={notes}
            maxLength={NOTES_MAX}
            onChange={event => setNotes(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2"
          />
        </label>

        {hasUnavailable && (
          <p className="text-sm text-red-700">
            Remove the dishes marked as unavailable to place your order.
          </p>
        )}

        <button
          type="submit"
          disabled={busy || hasUnavailable}
          className="w-full rounded-md bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:bg-stone-300 disabled:text-stone-600"
        >
          {busy ? "Placing order…" : "Place order"}
        </button>
      </form>
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
    <li className="flex gap-4 p-4">
      {product.imageUrl ?
        <img
          src={product.imageUrl}
          alt=""
          className="h-16 w-16 flex-none rounded-md object-cover"
        />
      : <div
          aria-hidden="true"
          className="flex h-16 w-16 flex-none items-center justify-center rounded-md bg-stone-100 text-2xl text-stone-400"
        >
          {product.name.charAt(0)}
        </div>
      }

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
        {item.notes && (
          <p className="text-sm text-stone-600">Note: {item.notes}</p>
        )}
        {!product.available && (
          <p className="text-sm text-red-700">
            Not available right now. Remove it to place your order.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Decrease quantity of ${product.name}`}
              disabled={disabled || quantity <= 1}
              onClick={onDecrease}
              className="h-8 w-8 rounded-md ring-1 ring-stone-300 hover:bg-stone-100 disabled:text-stone-300"
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
              className="h-8 w-8 rounded-md ring-1 ring-stone-300 hover:bg-stone-100 disabled:text-stone-300"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="text-sm text-red-700 underline disabled:text-stone-400"
          >
            Remove {product.name}
          </button>
        </div>
      </div>
    </li>
  );
}
