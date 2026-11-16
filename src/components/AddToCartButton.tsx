import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import { useCart } from "../cart/useCart";
import { cartErrorMessage } from "../lib/errors";

type AddToCartButtonProps = {
  productId: string;
  available: boolean;
};

/** Adds one unit through POST /cart/items. Anonymous visitors go to sign in first. */
export function AddToCartButton({
  productId,
  available
}: AddToCartButtonProps) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!available) {
    return (
      <button
        type="button"
        disabled
        className="rounded-md bg-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600"
      >
        Unavailable
      </button>
    );
  }

  async function handleClick() {
    if (!isAuthenticated) {
      void navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setPending(true);
    setAdded(false);
    setError(null);
    try {
      await addItem(productId);
      setAdded(true);
    } catch (caught) {
      setError(cartErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => void handleClick()}
        className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-stone-300 disabled:text-stone-600"
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>
      {added && (
        <p
          role="status"
          className="text-xs text-emerald-700"
        >
          Added to your cart
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="max-w-48 text-right text-xs text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
