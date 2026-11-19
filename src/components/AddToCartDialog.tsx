import { useEffect, useId, useState, type FormEvent } from "react";
import { useCart } from "../cart/useCart";
import { cartErrorMessage } from "../lib/errors";
import { formatCents } from "../lib/money";
import { productImageUrl } from "../lib/menu-images";
import { sizesFor } from "../lib/dish-options";
import { MAX_QUANTITY } from "../types/cart";
import type { Product } from "../types/menu";

type AddToCartDialogProps = {
  product: Product;
  onClose: () => void;
  onAdded: () => void;
};

/** Pop-up that asks for size and quantity before a dish goes to the cart. */
export function AddToCartDialog({
  product,
  onClose,
  onAdded
}: AddToCartDialogProps) {
  const { addItem } = useCart();
  const titleId = useId();
  const sizes = sizesFor(product.id);
  const [size, setSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const image = productImageUrl(product);

  // Escape closes the pop-up, and the page behind it stops scrolling while it is open.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await addItem(product.id, {
        quantity,
        size
      });
      onAdded();
      onClose();
    } catch (caught) {
      setError(cartErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 sm:items-center sm:p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={event => void handleSubmit(event)}
        className="flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight"
            >
              {product.name}
            </h2>
            <p className="font-semibold text-brand-600">
              {formatCents(product.priceCents)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-4">
          {image && (
            <img
              src={image}
              alt=""
              className="h-48 w-full rounded-2xl object-cover sm:h-56"
            />
          )}
          {product.description && (
            <p className="text-sm text-stone-600">{product.description}</p>
          )}

          {sizes.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold">Size</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {sizes.map(option => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm ring-1 ${
                      size === option ?
                        "bg-brand-50 font-medium text-brand-800 ring-brand-400"
                      : "bg-white ring-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="size"
                      value={option}
                      checked={size === option}
                      onChange={() => setSize(option)}
                      className="accent-brand-600"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-stone-100 p-4">
          <div className="flex items-center gap-2 rounded-full bg-stone-100 p-1">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1 || pending}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="h-9 w-9 rounded-full bg-white text-lg shadow-sm hover:bg-stone-50 disabled:text-stone-300"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="w-6 text-center font-semibold"
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={quantity >= MAX_QUANTITY || pending}
              onClick={() => setQuantity(q => Math.min(MAX_QUANTITY, q + 1))}
              className="h-9 w-9 rounded-full bg-white text-lg shadow-sm hover:bg-stone-50 disabled:text-stone-300"
            >
              +
            </button>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:bg-stone-300"
          >
            {pending ?
              "Adding…"
            : `Add ${quantity} to order · ${formatCents(product.priceCents * quantity)}`
            }
          </button>
        </div>
      </form>
    </div>
  );
}
