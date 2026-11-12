import { Link, useParams } from "react-router";
import { mockProducts } from "../mocks/menu";
import { formatCents } from "../lib/money";

export function ProductPage() {
  const { id } = useParams();
  const product = mockProducts.find(item => item.id === id);

  if (!product) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Dish not found</h1>
        <p className="text-stone-600">This dish does not exist.</p>
        <Link
          to="/"
          className="text-orange-700 underline"
        >
          Back to menu
        </Link>
      </section>
    );
  }

  return (
    <article className="mx-auto max-w-xl space-y-4">
      <Link
        to="/"
        className="text-sm text-orange-700 underline"
      >
        Back to menu
      </Link>

      {product.imageUrl ?
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-64 w-full rounded-lg object-cover"
        />
      : <div
          aria-hidden="true"
          className="flex h-64 items-center justify-center rounded-lg bg-stone-100 text-6xl text-stone-400"
        >
          {product.name.charAt(0)}
        </div>
      }

      <h1 className="text-2xl font-semibold">{product.name}</h1>
      <p className="text-stone-600">{product.description}</p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xl font-semibold">
          {formatCents(product.price)}
        </span>
        <button
          type="button"
          disabled={!product.available}
          className="rounded-md bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:bg-stone-300 disabled:text-stone-600"
        >
          {product.available ? "Add to cart" : "Unavailable"}
        </button>
      </div>
    </article>
  );
}
