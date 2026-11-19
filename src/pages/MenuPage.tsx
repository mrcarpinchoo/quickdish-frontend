import { useEffect, useState } from "react";
import { listCategories, listProducts } from "../api/menu";
import { AddToCartFlow } from "../components/AddToCartButton";
import { CartSummary, MobileCartBar } from "../components/CartSummary";
import { errorMessage } from "../lib/errors";
import { productImageUrl } from "../lib/menu-images";
import { formatCents } from "../lib/money";
import type { Category, Product } from "../types/menu";

const ALL_CATEGORIES = "all";

type MenuState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; categories: Category[]; products: Product[] };

export function MenuPage() {
  const [state, setState] = useState<MenuState>({ status: "loading" });

  useEffect(() => {
    let current = true;
    Promise.all([listCategories(), listProducts()])
      .then(([categories, products]) => {
        if (current) setState({ status: "ready", categories, products });
      })
      .catch((err: unknown) => {
        if (current) setState({ status: "error", message: errorMessage(err) });
      });
    return () => {
      current = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Menu</h1>
        <p className="text-stone-600">Loading menu…</p>
      </>
    );
  }

  if (state.status === "error") {
    return (
      <>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Menu</h1>
        <p
          role="alert"
          className="text-red-700"
        >
          {state.message}
        </p>
      </>
    );
  }

  return (
    <>
      <div className="grid gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-0">
        <MenuContent
          categories={state.categories}
          products={state.products}
        />
        <div className="hidden lg:block">
          <CartSummary />
        </div>
      </div>
      <MobileCartBar />
    </>
  );
}

function MenuContent({
  categories,
  products
}: {
  categories: Category[];
  products: Product[];
}) {
  const [selected, setSelected] = useState(ALL_CATEGORIES);
  const [query, setQuery] = useState("");

  const search = query.trim().toLowerCase();
  const visible = products.filter(
    product =>
      (selected === ALL_CATEGORIES || product.categoryId === selected) &&
      (search === "" ||
        product.name.toLowerCase().includes(search) ||
        (product.description ?? "").toLowerCase().includes(search))
  );

  const selectedName =
    selected === ALL_CATEGORIES ? "dishes" : (
      (categories.find(category => category.id === selected)?.name ?? "dishes")
    );

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Menu</h1>
            <p className="text-sm text-stone-500">¿Qué se te antoja hoy?</p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Search dishes</span>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search dishes"
              className="w-full rounded-full border border-stone-200 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm placeholder:text-stone-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </label>
        </div>

        <div
          role="group"
          aria-label="Categories"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
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

        <p className="text-sm text-stone-500">
          {visible.length} {visible.length === 1 ? "result" : "results"} in{" "}
          {selectedName}
        </p>
      </div>

      {visible.length === 0 ?
        <p className="rounded-2xl bg-white p-6 text-center text-stone-600 ring-1 ring-stone-100">
          No dishes match your search.
        </p>
      : <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {visible.map(product => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      }
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ?
          "bg-brand-600 text-white shadow-sm"
        : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-brand-50 hover:text-brand-700"
      }`}
    >
      {label}
    </button>
  );
}

function ProductCard({ product }: { product: Product }) {
  const image = productImageUrl(product);

  return (
    <AddToCartFlow
      product={product}
      className="flex h-full flex-col"
    >
      {start => (
        <article className="flex h-full flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-100 transition-shadow hover:shadow-md">
          {image ?
            <button
              type="button"
              onClick={start}
              disabled={!product.available}
              aria-label={`Open ${product.name}`}
              className="block w-full overflow-hidden rounded-xl disabled:cursor-not-allowed"
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                className="aspect-4/3 w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          : <div
              aria-hidden="true"
              className="flex aspect-4/3 items-center justify-center rounded-xl bg-stone-100 text-4xl text-stone-400"
            >
              {product.name.charAt(0)}
            </div>
          }

          <div className="flex flex-1 flex-col gap-1 px-1">
            <h2 className="leading-snug font-semibold">
              <button
                type="button"
                onClick={start}
                disabled={!product.available}
                className="text-left hover:text-brand-700 disabled:cursor-not-allowed"
              >
                {product.name}
              </button>
            </h2>
            {product.description && (
              <p className="line-clamp-2 text-sm text-stone-500">
                {product.description}
              </p>
            )}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
              <span className="text-lg font-semibold text-brand-600">
                {formatCents(product.priceCents)}
              </span>
              {product.available ?
                <button
                  type="button"
                  onClick={start}
                  className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white shadow-sm hover:bg-brand-700"
                >
                  Add to cart
                </button>
              : <button
                  type="button"
                  disabled
                  className="rounded-xl bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600"
                >
                  Unavailable
                </button>
              }
            </div>
          </div>
        </article>
      )}
    </AddToCartFlow>
  );
}
