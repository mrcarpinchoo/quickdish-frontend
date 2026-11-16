import { useState } from "react";
import { Link } from "react-router";
import { mockCategories, mockProducts } from "../mocks/menu";
import { AddToCartButton } from "../components/AddToCartButton";
import { formatCents } from "../lib/money";
import type { Product } from "../types/menu";

const ALL_CATEGORIES = "all";

export function MenuPage() {
  const [selected, setSelected] = useState(ALL_CATEGORIES);

  const categories = mockCategories.filter(category => category.active);
  const products = mockProducts.filter(
    product => selected === ALL_CATEGORIES || product.categoryId === selected
  );

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Menu</h1>

      <div
        role="group"
        aria-label="Categories"
        className="flex flex-wrap gap-2"
      >
        <CategoryChip
          label="All"
          active={selected === ALL_CATEGORIES}
          onClick={() => setSelected(ALL_CATEGORIES)}
        />
        {categories.map(category => (
          <CategoryChip
            key={category.id}
            label={category.name}
            active={selected === category.id}
            onClick={() => setSelected(category.id)}
          />
        ))}
      </div>

      {products.length === 0 ?
        <p className="text-stone-600">No dishes in this category.</p>
      : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      }
    </section>
  );
}

type CategoryChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function CategoryChip({ label, active, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm ring-1 ${
        active ?
          "bg-stone-900 text-white ring-stone-900"
        : "bg-white text-stone-700 ring-stone-300 hover:bg-stone-100"
      }`}
    >
      {label}
    </button>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
      {product.imageUrl ?
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-40 w-full object-cover"
        />
      : <div
          aria-hidden="true"
          className="flex h-40 items-center justify-center bg-stone-100 text-4xl text-stone-400"
        >
          {product.name.charAt(0)}
        </div>
      }

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-lg font-semibold">
          <Link
            to={`/products/${product.id}`}
            className="hover:underline"
          >
            {product.name}
          </Link>
        </h2>
        <p className="text-sm text-stone-600">{product.description}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-semibold">{formatCents(product.price)}</span>
          <AddToCartButton
            productId={product.id}
            available={product.available}
          />
        </div>
      </div>
    </article>
  );
}
