import { useState } from "react";
import { Link } from "react-router";
import { useCart } from "../cart/useCart";
import { formatCents } from "../lib/money";
import { MAX_QUANTITY } from "../types/cart";

type SummaryLine = {
  /** Cart item id for customers, guest line id for guests. */
  lineId: string;
  name: string;
  quantity: number;
  subtotalCents: number;
};

/** The signed-in customer's cart as summary lines. */
function useSummary() {
  const { cart, itemCount, setQuantity, removeItem } = useCart();

  const lines: SummaryLine[] =
    cart?.items.map(item => ({
      lineId: item.id,
      name: item.product.name,
      quantity: item.quantity,
      subtotalCents: item.subtotalCents
    })) ?? [];

  const totalCents = cart?.totalCents ?? 0;

  return { lines, totalCents, itemCount, setQuantity, removeItem };
}

/** Order summary beside the menu on wide screens. Lines can be changed here. */
export function CartSummary() {
  const { lines, totalCents, itemCount, setQuantity, removeItem } =
    useSummary();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      setError("We could not update your order. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      aria-label="Your order"
      className="sticky top-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Your order</h2>
        <span className="text-sm text-stone-500">{itemCount} items</span>
      </div>

      {lines.length === 0 ?
        <p className="text-sm text-stone-600">
          Your cart is empty. Add a dish to start your order.
        </p>
      : <ul className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {lines.map(line => (
            <li
              key={line.lineId}
              className="rounded-xl bg-stone-50 p-3 text-sm"
            >
              <div className="flex justify-between gap-3">
                <span className="font-medium text-stone-800">{line.name}</span>
                <span className="font-medium">
                  {formatCents(line.subtotalCents)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${line.name}`}
                    disabled={busy || line.quantity <= 1}
                    onClick={() =>
                      void change(() =>
                        setQuantity(line.lineId, line.quantity - 1)
                      )
                    }
                    className="h-7 w-7 rounded-lg bg-white ring-1 ring-stone-200 hover:bg-stone-100 disabled:text-stone-300"
                  >
                    −
                  </button>
                  <span
                    aria-label={`Quantity of ${line.name}`}
                    className="w-6 text-center"
                  >
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${line.name}`}
                    disabled={busy || line.quantity >= MAX_QUANTITY}
                    onClick={() =>
                      void change(() =>
                        setQuantity(line.lineId, line.quantity + 1)
                      )
                    }
                    className="h-7 w-7 rounded-lg bg-white ring-1 ring-stone-200 hover:bg-stone-100 disabled:text-stone-300"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${line.name}`}
                  disabled={busy}
                  onClick={() => void change(() => removeItem(line.lineId))}
                  className="text-xs font-medium text-red-600 hover:underline disabled:text-stone-400"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      }

      {error && (
        <p
          role="alert"
          className="text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex justify-between border-t border-stone-100 pt-4 text-base font-semibold">
        <span>Total</span>
        <span>{formatCents(totalCents)}</span>
      </div>

      <Link
        to="/cart"
        aria-disabled={lines.length === 0}
        className={`block rounded-xl px-4 py-3 text-center font-semibold ${
          lines.length === 0 ?
            "pointer-events-none bg-stone-200 text-stone-500"
          : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        View cart and checkout
      </Link>
    </aside>
  );
}

/** Sticky bar at the bottom of phones, so the order stays one tap away. */
export function MobileCartBar() {
  const { lines, totalCents, itemCount } = useSummary();

  if (lines.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <Link
        to="/cart"
        className="flex items-center justify-between rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700"
      >
        <span>View cart · {itemCount}</span>
        <span>{formatCents(totalCents)}</span>
      </Link>
    </div>
  );
}
