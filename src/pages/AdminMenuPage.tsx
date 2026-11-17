import { useEffect, useState, type FormEvent } from "react";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  listAllCategories,
  listAllProducts,
  setProductAvailability,
  updateCategory,
  updateProduct
} from "../api/admin-menu";
import { errorMessage } from "../lib/errors";
import { formatCents } from "../lib/money";
import type { Category, Product } from "../types/menu";

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

/** Turns a price typed in pesos ("35.50") into integer cents (3550). */
function parsePriceToCents(text: string): number | null {
  const trimmed = text.trim();
  if (!PRICE_PATTERN.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  return cents > 0 ? cents : null;
}

export function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    Promise.all([listAllCategories(), listAllProducts()])
      .then(([loadedCategories, loadedProducts]) => {
        if (!current) return;
        setCategories(loadedCategories);
        setProducts(loadedProducts);
        setLoadError(null);
      })
      .catch((caught: unknown) => {
        if (current) setLoadError(errorMessage(caught));
      });
    return () => {
      current = false;
    };
  }, []);

  async function reload() {
    try {
      const [loadedCategories, loadedProducts] = await Promise.all([
        listAllCategories(),
        listAllProducts()
      ]);
      setCategories(loadedCategories);
      setProducts(loadedProducts);
      setLoadError(null);
    } catch (caught) {
      setLoadError(errorMessage(caught));
    }
  }

  /** Runs one change, shows the API's message on failure, then reloads. */
  async function run(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  /** Closes the edit form and refreshes the list after a successful save. */
  async function finishEdit() {
    setEditingId(null);
    await reload();
  }

  function toggleCategory(category: Category) {
    return run(category.id, () =>
      updateCategory(category.id, { active: !category.active })
    );
  }

  function removeCategory(category: Category) {
    if (!window.confirm(`Delete the category "${category.name}"?`)) return;
    return run(category.id, () => deleteCategory(category.id));
  }

  function toggleAvailability(product: Product) {
    return run(product.id, () =>
      setProductAvailability(product.id, !product.available)
    );
  }

  function removeProduct(product: Product) {
    if (!window.confirm(`Delete the dish "${product.name}"?`)) return;
    return run(product.id, () => deleteProduct(product.id));
  }

  const loading = categories === null && products === null && !loadError;

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-semibold">Manage menu</h1>

      {loading && <p className="text-stone-600">Loading menu…</p>}

      {loadError && (
        <p
          role="alert"
          className="text-red-700"
        >
          {loadError}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {categories && (
        <section
          aria-labelledby="categories-heading"
          className="space-y-4"
        >
          <h2
            id="categories-heading"
            className="text-xl font-semibold"
          >
            Categories
          </h2>

          <CategoryForm onCreated={reload} />

          {categories.length === 0 ?
            <p className="text-stone-600">No categories yet.</p>
          : <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
              {categories.map(category =>
                editingId === category.id ?
                  <li
                    key={category.id}
                    className="p-3"
                  >
                    <CategoryEditForm
                      category={category}
                      onSaved={finishEdit}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                : <li
                    key={category.id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <span>
                      {category.name}
                      {!category.active && (
                        <span className="ml-2 text-sm text-stone-500">
                          (inactive)
                        </span>
                      )}
                    </span>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(category.id)}
                        className="rounded-md border border-stone-300 px-3 py-1 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === category.id}
                        onClick={() => void toggleCategory(category)}
                        className="rounded-md border border-stone-300 px-3 py-1 text-sm"
                      >
                        {category.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === category.id}
                        onClick={() => void removeCategory(category)}
                        className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700"
                      >
                        Delete
                      </button>
                    </span>
                  </li>
              )}
            </ul>
          }
        </section>
      )}

      {products && categories && (
        <section
          aria-labelledby="products-heading"
          className="space-y-4"
        >
          <h2
            id="products-heading"
            className="text-xl font-semibold"
          >
            Dishes
          </h2>

          <ProductForm
            categories={categories}
            onCreated={reload}
          />

          {products.length === 0 ?
            <p className="text-stone-600">No dishes yet.</p>
          : <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
              {products.map(product =>
                editingId === product.id ?
                  <li
                    key={product.id}
                    className="p-3"
                  >
                    <ProductEditForm
                      product={product}
                      categories={categories}
                      onSaved={finishEdit}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                : <li
                    key={product.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <span>
                      {product.name}{" "}
                      <span className="text-sm text-stone-600">
                        {formatCents(product.priceCents)}
                      </span>
                      {!product.available && (
                        <span className="ml-2 text-sm text-stone-500">
                          (unavailable)
                        </span>
                      )}
                    </span>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(product.id)}
                        className="rounded-md border border-stone-300 px-3 py-1 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() => void toggleAvailability(product)}
                        className="rounded-md border border-stone-300 px-3 py-1 text-sm"
                      >
                        {product.available ?
                          "Mark unavailable"
                        : "Mark available"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() => void removeProduct(product)}
                        className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700"
                      >
                        Delete
                      </button>
                    </span>
                  </li>
              )}
            </ul>
          }
        </section>
      )}
    </section>
  );
}

function CategoryForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a name for the category.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createCategory({ name: name.trim() });
      setName("");
      await onCreated();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={event => void submit(event)}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col text-sm">
        Category name
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-orange-700 px-4 py-2 text-white"
      >
        Add category
      </button>
      {error && (
        <p
          role="alert"
          className="w-full text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </form>
  );
}

function ProductForm({
  categories,
  onCreated
}: {
  categories: Category[];
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceCents = parsePriceToCents(price);
    if (!name.trim()) {
      setError("Enter a name for the dish.");
      return;
    }
    if (priceCents === null) {
      setError("Enter a price in pesos, for example 35 or 35.50.");
      return;
    }
    if (!categoryId) {
      setError("Create a category first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createProduct({
        name: name.trim(),
        priceCents,
        categoryId,
        available: true
      });
      setName("");
      setPrice("");
      await onCreated();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={event => void submit(event)}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col text-sm">
        Dish name
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col text-sm">
        Price (MXN)
        <input
          value={price}
          inputMode="decimal"
          onChange={event => setPrice(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col text-sm">
        Category
        <select
          value={categoryId}
          onChange={event => setCategoryId(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        >
          {categories.map(category => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-orange-700 px-4 py-2 text-white"
      >
        Add dish
      </button>
      {error && (
        <p
          role="alert"
          className="w-full text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </form>
  );
}

/** Text for an optional field: empty input means "no value" (null). */
function optionalText(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

function CategoryEditForm({
  category,
  onSaved,
  onCancel
}: {
  category: Category;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a name for the category.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateCategory(category.id, {
        name: name.trim(),
        description: optionalText(description)
      });
      await onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      aria-label="Edit category"
      onSubmit={event => void submit(event)}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col text-sm">
        Category name
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col text-sm">
        Description
        <input
          value={description}
          onChange={event => setDescription(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-orange-700 px-4 py-2 text-white"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-stone-300 px-4 py-2"
      >
        Cancel
      </button>
      {error && (
        <p
          role="alert"
          className="w-full text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </form>
  );
}

function ProductEditForm({
  product,
  categories,
  onSaved,
  onCancel
}: {
  product: Product;
  categories: Category[];
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState((product.priceCents / 100).toFixed(2));
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceCents = parsePriceToCents(price);
    if (!name.trim()) {
      setError("Enter a name for the dish.");
      return;
    }
    if (priceCents === null) {
      setError("Enter a price in pesos, for example 35 or 35.50.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProduct(product.id, {
        name: name.trim(),
        description: optionalText(description),
        priceCents,
        imageUrl: optionalText(imageUrl),
        categoryId
      });
      await onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      aria-label="Edit dish"
      onSubmit={event => void submit(event)}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col text-sm">
        Dish name
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col text-sm">
        Description
        <input
          value={description}
          onChange={event => setDescription(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col text-sm">
        Price (MXN)
        <input
          value={price}
          inputMode="decimal"
          onChange={event => setPrice(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col text-sm">
        Image URL
        <input
          value={imageUrl}
          inputMode="url"
          onChange={event => setImageUrl(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col text-sm">
        Category
        <select
          value={categoryId}
          onChange={event => setCategoryId(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2"
        >
          {categories.map(category => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-orange-700 px-4 py-2 text-white"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-stone-300 px-4 py-2"
      >
        Cancel
      </button>
      {error && (
        <p
          role="alert"
          className="w-full text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </form>
  );
}
