import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getProduct } from "../api/menu";
import { ApiError } from "../api/client";
import { AddToCartButton } from "../components/AddToCartButton";
import { errorMessage } from "../lib/errors";
import { formatCents } from "../lib/money";
import type { Product } from "../types/menu";

type ProductState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; product: Product };

export function ProductPage() {
  const { id = "" } = useParams();
  const [state, setState] = useState<ProductState>({ status: "loading" });

  useEffect(() => {
    let current = true;
    getProduct(id)
      .then(product => {
        if (current) setState({ status: "ready", product });
      })
      .catch((err: unknown) => {
        if (!current) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({ status: "missing" });
        } else {
          setState({ status: "error", message: errorMessage(err) });
        }
      });
    return () => {
      current = false;
    };
  }, [id]);

  if (state.status === "loading") {
    return <p className="text-stone-600">Loading dish…</p>;
  }

  if (state.status === "missing") {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Dish not found</h1>
        <p className="text-stone-600">This dish does not exist.</p>
        <Link
          to="/menu"
          className="text-brand-700 underline"
        >
          Back to menu
        </Link>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="space-y-4">
        <p
          role="alert"
          className="text-red-700"
        >
          {state.message}
        </p>
        <Link
          to="/menu"
          className="text-brand-700 underline"
        >
          Back to menu
        </Link>
      </section>
    );
  }

  const { product } = state;

  return (
    <article className="mx-auto max-w-xl space-y-4">
      <Link
        to="/menu"
        className="text-sm text-brand-700 underline"
      >
        Back to menu
      </Link>

      <div
        aria-hidden="true"
        className="flex h-64 items-center justify-center rounded-lg bg-stone-100 text-6xl text-stone-400"
      >
        {product.name.charAt(0)}
      </div>

      <h1 className="text-2xl font-semibold">{product.name}</h1>
      <p className="text-stone-600">{product.description}</p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xl font-semibold">
          {formatCents(product.priceCents)}
        </span>
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
