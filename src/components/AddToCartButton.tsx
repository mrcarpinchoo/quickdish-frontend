import { useState, type ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import type { Product } from "../types/menu";
import { AddToCartDialog } from "./AddToCartDialog";
import { SignInDialog } from "./SignInDialog";

type AddToCartFlowProps = {
  product: Product;
  /** Renders whatever should start the flow, such as a button or the dish photo. */
  children: (start: () => void) => ReactNode;
  className?: string;
};

/**
 * The add-to-cart flow for one dish: anonymous visitors get a sign-in pop-up first,
 * then the dish pop-up opens. Any element passed as children can start it.
 */
export function AddToCartFlow({
  product,
  children,
  className = "flex flex-col items-end gap-1"
}: AddToCartFlowProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [added, setAdded] = useState(false);

  function start() {
    setAdded(false);
    if (isAuthenticated) {
      setOpen(true);
    } else {
      setSigningIn(true);
    }
  }

  return (
    <div className={className}>
      {children(start)}
      {added && (
        <p
          role="status"
          className="text-xs text-emerald-700"
        >
          Added to your cart
        </p>
      )}
      {signingIn && (
        <SignInDialog
          onClose={() => setSigningIn(false)}
          onSignedIn={() => {
            setSigningIn(false);
            setOpen(true);
          }}
        />
      )}
      {open && (
        <AddToCartDialog
          product={product}
          onClose={() => setOpen(false)}
          onAdded={() => setAdded(true)}
        />
      )}
    </div>
  );
}

type AddToCartButtonProps = {
  product: Product;
};

/** The "Add to cart" button. Unavailable dishes show a disabled button instead. */
export function AddToCartButton({ product }: AddToCartButtonProps) {
  if (!product.available) {
    return (
      <button
        type="button"
        disabled
        className="rounded-xl bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600"
      >
        Unavailable
      </button>
    );
  }

  return (
    <AddToCartFlow product={product}>
      {start => (
        <button
          type="button"
          onClick={start}
          className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white shadow-sm hover:bg-brand-700"
        >
          Add to cart
        </button>
      )}
    </AddToCartFlow>
  );
}
