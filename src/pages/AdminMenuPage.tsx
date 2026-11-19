import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  listAllCategories,
  listAllProducts,
  removeProductPhoto,
  setProductAvailability,
  updateCategory,
  updateProduct,
  uploadProductPhoto
} from "../api/admin-menu";
import { errorMessage } from "../lib/errors";
import { shrinkDishPhoto } from "../lib/image-upload";
import { productImageUrl } from "../lib/menu-images";
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

/** Text for an optional field: empty input means "no value" (null). */
function optionalText(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

type Tab = "dishes" | "categories";

type DialogState =
  | { kind: "new-dish" }
  | { kind: "edit-dish"; product: Product }
  | { kind: "new-category" }
  | { kind: "edit-category"; category: Category }
  | null;

type Notice = { tone: "ok" | "error"; text: string };

export function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("dishes");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  async function loadAll() {
    const [loadedCategories, loadedProducts] = await Promise.all([
      listAllCategories(),
      listAllProducts()
    ]);
    setCategories(loadedCategories);
    setProducts(loadedProducts);
    setLoadError(null);
  }

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

  /** Refreshes the lists, keeping any message that is already on screen. */
  async function reload() {
    try {
      await loadAll();
    } catch (caught) {
      setLoadError(errorMessage(caught));
    }
  }

  /** Runs one change, says what happened, then reloads the lists. */
  async function run(id: string, action: () => Promise<unknown>, done: string) {
    setBusyId(id);
    setNotice(null);
    try {
      await action();
      setNotice({ tone: "ok", text: done });
      await reload();
    } catch (caught) {
      setNotice({ tone: "error", text: errorMessage(caught) });
    } finally {
      setBusyId(null);
    }
  }

  async function saved(text: string) {
    setDialog(null);
    setNotice({ tone: "ok", text });
    await reload();
  }

  function toggleAvailability(product: Product) {
    return run(
      product.id,
      () => setProductAvailability(product.id, !product.available),
      product.available ?
        `${product.name} is now hidden from customers.`
      : `${product.name} is available again.`
    );
  }

  function removeProduct(product: Product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`))
      return;
    return run(
      product.id,
      () => deleteProduct(product.id),
      `${product.name} was deleted.`
    );
  }

  function toggleCategory(category: Category) {
    return run(
      category.id,
      () => updateCategory(category.id, { active: !category.active }),
      category.active ?
        `${category.name} is hidden from customers.`
      : `${category.name} is visible again.`
    );
  }

  function removeCategory(category: Category) {
    if (!window.confirm(`Delete the category "${category.name}"?`)) return;
    return run(
      category.id,
      () => deleteCategory(category.id),
      `${category.name} was deleted.`
    );
  }

  if (loadError) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Manage menu</h1>
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-red-700"
        >
          {loadError}
        </p>
      </section>
    );
  }

  if (categories === null || products === null) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Manage menu</h1>
        <p className="text-stone-600">Loading your menu…</p>
      </section>
    );
  }

  const activeCategoryIds = new Set(
    categories.filter(category => category.active).map(category => category.id)
  );
  const categoryName = new Map(
    categories.map(category => [category.id, category.name])
  );
  const dishCount = (categoryId: string) =>
    products.filter(product => product.categoryId === categoryId).length;

  const search = query.trim().toLowerCase();
  const visibleProducts = products.filter(
    product =>
      (categoryFilter === "all" || product.categoryId === categoryFilter) &&
      (search === "" || product.name.toLowerCase().includes(search))
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage menu</h1>
          <p className="text-sm text-stone-500">
            Add dishes, change prices and decide what customers can order.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDialog({ kind: "new-category" })}
            className="rounded-xl bg-white px-4 py-2.5 font-semibold text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50"
          >
            + New category
          </button>
          <button
            type="button"
            onClick={() => setDialog({ kind: "new-dish" })}
            disabled={categories.length === 0}
            className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:bg-stone-300"
          >
            + New dish
          </button>
        </div>
      </div>

      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`rounded-xl p-3 text-sm font-medium ${
            notice.tone === "error" ?
              "bg-red-50 text-red-700"
            : "bg-brand-50 text-brand-800"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div
        role="tablist"
        aria-label="Menu sections"
        className="inline-flex gap-1 rounded-2xl bg-white p-1 text-sm font-semibold shadow-sm ring-1 ring-stone-100"
      >
        <TabButton
          active={tab === "dishes"}
          onClick={() => setTab("dishes")}
          label={`Dishes (${products.length})`}
        />
        <TabButton
          active={tab === "categories"}
          onClick={() => setTab("categories")}
          label={`Categories (${categories.length})`}
        />
      </div>

      {tab === "dishes" ?
        <section
          role="tabpanel"
          aria-label="Dishes"
          className="space-y-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search dishes</span>
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search dishes by name"
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-stone-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
              />
            </label>
            <label className="sm:w-56">
              <span className="sr-only">Filter by category</span>
              <select
                value={categoryFilter}
                onChange={event => setCategoryFilter(event.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
              >
                <option value="all">All categories</option>
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
          </div>

          {products.length === 0 ?
            <EmptyState
              title="No dishes yet"
              text="Create your first dish and it will show up on the menu."
              action={
                categories.length === 0 ?
                  undefined
                : <button
                    type="button"
                    onClick={() => setDialog({ kind: "new-dish" })}
                    className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700"
                  >
                    + New dish
                  </button>
              }
              footer={
                categories.length === 0 ?
                  "First, create a category to group your dishes."
                : undefined
              }
            />
          : visibleProducts.length === 0 ?
            <p className="rounded-2xl bg-white p-6 text-center text-stone-600 ring-1 ring-stone-100">
              No dishes match your search.
            </p>
          : <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map(product => {
                const hidden = !activeCategoryIds.has(product.categoryId);
                return (
                  <li
                    key={product.id}
                    className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
                  >
                    <div className="flex gap-4">
                      {productImageUrl(product) ?
                        <img
                          src={productImageUrl(product) ?? undefined}
                          alt=""
                          className="h-20 w-20 flex-none rounded-xl object-cover"
                        />
                      : <div
                          aria-hidden="true"
                          className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-stone-100 text-2xl text-stone-400"
                        >
                          {product.name.charAt(0)}
                        </div>
                      }
                      <div className="min-w-0 flex-1 space-y-1">
                        <h2 className="truncate font-semibold">
                          {product.name}
                        </h2>
                        <p className="text-sm text-stone-500">
                          {categoryName.get(product.categoryId) ??
                            "No category"}
                        </p>
                        <p className="font-semibold text-brand-600">
                          {formatCents(product.priceCents)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusPill
                        tone={
                          hidden ? "amber"
                          : product.available ?
                            "green"
                          : "stone"
                        }
                        text={
                          hidden ? "Hidden (category off)"
                          : product.available ?
                            "Available"
                          : "Sold out"
                        }
                      />
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() => void toggleAvailability(product)}
                        className="rounded-xl bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-200 disabled:text-stone-400"
                      >
                        {product.available ? "Mark sold out" : "Mark available"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDialog({ kind: "edit-dish", product })
                        }
                        className="rounded-xl px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() => void removeProduct(product)}
                        className="ml-auto rounded-xl px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:text-stone-400"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          }
        </section>
      : <section
          role="tabpanel"
          aria-label="Categories"
          className="space-y-5"
        >
          {categories.length === 0 ?
            <EmptyState
              title="No categories yet"
              text="Categories group your dishes, like Drinks, Bowls or Desserts."
              action={
                <button
                  type="button"
                  onClick={() => setDialog({ kind: "new-category" })}
                  className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700"
                >
                  + New category
                </button>
              }
            />
          : <ul className="grid gap-4 md:grid-cols-2">
              {categories.map(category => (
                <li
                  key={category.id}
                  className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="font-semibold">{category.name}</h2>
                      {category.description && (
                        <p className="text-sm text-stone-500">
                          {category.description}
                        </p>
                      )}
                      <p className="text-sm text-stone-500">
                        {dishCount(category.id)}{" "}
                        {dishCount(category.id) === 1 ? "dish" : "dishes"}
                      </p>
                    </div>
                    <StatusPill
                      tone={category.active ? "green" : "stone"}
                      text={category.active ? "Visible" : "Hidden"}
                    />
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                    <button
                      type="button"
                      disabled={busyId === category.id}
                      onClick={() => void toggleCategory(category)}
                      className="rounded-xl bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-200 disabled:text-stone-400"
                    >
                      {category.active ? "Hide from menu" : "Show on menu"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDialog({ kind: "edit-category", category })
                      }
                      className="rounded-xl px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId === category.id}
                      onClick={() => void removeCategory(category)}
                      className="ml-auto rounded-xl px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:text-stone-400"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          }
        </section>
      }

      {dialog?.kind === "new-dish" && categories.length > 0 && (
        <ProductDialog
          title="New dish"
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={() => saved("Dish created.")}
        />
      )}
      {dialog?.kind === "edit-dish" && (
        <ProductDialog
          title={`Edit ${dialog.product.name}`}
          product={dialog.product}
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={() => saved("Changes saved.")}
        />
      )}
      {dialog?.kind === "new-category" && (
        <CategoryDialog
          title="New category"
          onClose={() => setDialog(null)}
          onSaved={() => saved("Category created.")}
        />
      )}
      {dialog?.kind === "edit-category" && (
        <CategoryDialog
          title={`Edit ${dialog.category.name}`}
          category={dialog.category}
          products={products}
          categoryName={categoryName}
          onClose={() => setDialog(null)}
          onSaved={() => saved("Changes saved.")}
          onMoveDish={product =>
            run(
              product.id,
              () =>
                updateProduct(product.id, {
                  categoryId: dialog.category.id
                }),
              `${product.name} is now in ${dialog.category.name}.`
            )
          }
        />
      )}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-xl px-4 py-2 transition-colors ${
        active ?
          "bg-brand-600 text-white shadow-sm"
        : "text-stone-600 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );
}

function StatusPill({
  tone,
  text
}: {
  tone: "green" | "stone" | "amber";
  text: string;
}) {
  const tones = {
    green: "bg-brand-50 text-brand-800 ring-brand-200",
    stone: "bg-stone-100 text-stone-600 ring-stone-200",
    amber: "bg-sun-100 text-sun-800 ring-sun-300"
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tones[tone]}`}
    >
      {text}
    </span>
  );
}

function EmptyState({
  title,
  text,
  action,
  footer
}: {
  title: string;
  text: string;
  action?: ReactNode;
  footer?: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-100">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-stone-600">{text}</p>
      {action}
      {footer && <p className="text-sm text-stone-500">{footer}</p>}
    </div>
  );
}

/** Shared pop-up frame for every create and edit form. */
function Modal({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 sm:items-center sm:p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-6 py-4">
          <h2
            id={titleId}
            className="text-lg font-semibold"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const FIELD =
  "mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none";

function ProductDialog({
  title,
  product,
  categories,
  onClose,
  onSaved
}: {
  title: string;
  product?: Product;
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(
    product ? (product.priceCents / 100).toFixed(2) : ""
  );
  /** A photo the admin picked, not uploaded yet. */
  const [photo, setPhoto] = useState<Blob | null>(null);
  /** Set when the admin clicks "Remove photo" on a dish that has one. */
  const [removePhoto, setRemovePhoto] = useState(false);
  const previewUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo]
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  const savedImage = product ? productImageUrl(product) : null;
  const shownImage = previewUrl ?? (removePhoto ? null : savedImage);
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceCents = parsePriceToCents(price);
    if (!name.trim()) {
      setError("Give the dish a name.");
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
    const fields = {
      name: name.trim(),
      description: optionalText(description),
      priceCents,
      categoryId
    };
    let saved: Product;
    try {
      saved =
        product ?
          await updateProduct(product.id, fields)
        : await createProduct({ ...fields, available: true });
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
      return;
    }

    try {
      if (photo) {
        await uploadProductPhoto(saved.id, photo);
      } else if (removePhoto && product?.imageUrl) {
        await removeProductPhoto(saved.id);
      }
    } catch (caught) {
      // The dish itself is saved; only the photo failed.
      setError(
        `The dish was saved, but its photo was not: ${errorMessage(caught)} Close this and edit the dish to try the photo again.`
      );
      setSaving(false);
      return;
    }
    await onSaved();
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
    >
      <form
        aria-label={product ? "Edit dish" : "New dish"}
        onSubmit={event => void submit(event)}
        className="space-y-4"
      >
        <label className="block text-sm font-medium">
          Name
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            className={FIELD}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Price (MXN)
            <input
              value={price}
              inputMode="decimal"
              placeholder="35.00"
              onChange={event => setPrice(event.target.value)}
              className={FIELD}
            />
          </label>
          <label className="block text-sm font-medium">
            Category
            <select
              value={categoryId}
              onChange={event => setCategoryId(event.target.value)}
              className={FIELD}
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
        </div>
        <label className="block text-sm font-medium">
          Description{" "}
          <span className="font-normal text-stone-500">(optional)</span>
          <textarea
            value={description}
            rows={2}
            onChange={event => setDescription(event.target.value)}
            className={FIELD}
          />
        </label>
        <div className="space-y-2">
          <p className="text-sm font-medium">Photo</p>
          <div className="flex items-center gap-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3">
            {shownImage ?
              <img
                src={shownImage}
                alt=""
                className="h-20 w-20 flex-none rounded-xl object-cover"
              />
            : <div
                aria-hidden="true"
                className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-white text-2xl text-stone-400 ring-1 ring-stone-200"
              >
                {name.trim().charAt(0) || "?"}
              </div>
            }
            <div className="min-w-0 flex-1 space-y-2">
              <label className="inline-flex cursor-pointer items-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-stone-800 ring-1 ring-stone-200 hover:bg-stone-100">
                {shownImage ? "Replace photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    shrinkDishPhoto(file)
                      .then(shrunk => {
                        setPhoto(shrunk);
                        setRemovePhoto(false);
                      })
                      .catch((caught: unknown) =>
                        setError(errorMessage(caught))
                      );
                  }}
                />
              </label>
              {shownImage && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setRemovePhoto(true);
                  }}
                  className="ml-2 text-sm font-medium text-red-600 hover:underline"
                >
                  Remove photo
                </button>
              )}
              <p className="text-xs text-stone-500">
                JPG or PNG. We shrink it for you.
              </p>
            </div>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 font-medium text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:bg-stone-300"
          >
            {saving ?
              "Saving…"
            : product ?
              "Save changes"
            : "Create dish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryDialog({
  title,
  category,
  products,
  categoryName,
  onClose,
  onSaved,
  onMoveDish
}: {
  title: string;
  category?: Category;
  products?: Product[];
  categoryName?: Map<string, string>;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onMoveDish?: (product: Product) => Promise<unknown> | undefined;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dishQuery, setDishQuery] = useState("");
  const [dishFilter, setDishFilter] = useState<"all" | "outside" | "inside">(
    "all"
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give the category a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (category) {
        await updateCategory(category.id, {
          name: name.trim(),
          description: optionalText(description)
        });
      } else {
        await createCategory({
          name: name.trim(),
          description: optionalText(description)
        });
      }
      await onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  }

  const search = dishQuery.trim().toLowerCase();
  const dishes = (products ?? []).filter(
    product =>
      (search === "" || product.name.toLowerCase().includes(search)) &&
      (dishFilter === "all" ||
        (dishFilter === "inside" && product.categoryId === category?.id) ||
        (dishFilter === "outside" && product.categoryId !== category?.id))
  );

  return (
    <Modal
      title={title}
      onClose={onClose}
    >
      <form
        aria-label={category ? "Edit category" : "New category"}
        onSubmit={event => void submit(event)}
        className="space-y-4"
      >
        <label className="block text-sm font-medium">
          Name
          <input
            value={name}
            placeholder="Drinks, Bowls, Desserts…"
            onChange={event => setName(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-medium">
          Description{" "}
          <span className="font-normal text-stone-500">(optional)</span>
          <input
            value={description}
            onChange={event => setDescription(event.target.value)}
            className={FIELD}
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 font-medium text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:bg-stone-300"
          >
            {saving ?
              "Saving…"
            : category ?
              "Save changes"
            : "Create category"}
          </button>
        </div>
      </form>

      {category && products && onMoveDish && (
        <section
          aria-labelledby="category-dishes-heading"
          className="mt-6 space-y-3 border-t border-stone-100 pt-5"
        >
          <div>
            <h3
              id="category-dishes-heading"
              className="font-semibold"
            >
              Dishes in {category.name}
            </h3>
            <p className="text-sm text-stone-500">
              Add dishes that belong here. Each dish moves out of its current
              category.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">Search dishes</span>
              <input
                type="search"
                value={dishQuery}
                onChange={event => setDishQuery(event.target.value)}
                placeholder="Search a dish"
                className={FIELD}
              />
            </label>
            <label className="sm:w-48">
              <span className="sr-only">Show dishes</span>
              <select
                value={dishFilter}
                onChange={event =>
                  setDishFilter(
                    event.target.value as "all" | "outside" | "inside"
                  )
                }
                className={FIELD}
              >
                <option value="all">All dishes</option>
                <option value="outside">Not in {category.name}</option>
                <option value="inside">In {category.name}</option>
              </select>
            </label>
          </div>

          {dishes.length === 0 ?
            <p className="rounded-xl bg-stone-50 p-4 text-center text-sm text-stone-600">
              No dishes match.
            </p>
          : <ul className="max-h-64 divide-y divide-stone-100 overflow-y-auto rounded-xl border border-stone-100">
              {dishes.map(product => {
                const inside = product.categoryId === category.id;
                return (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {categoryName?.get(product.categoryId) ?? "No category"}
                      </p>
                    </div>
                    {inside ?
                      <span className="flex-none rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-200">
                        In this category
                      </span>
                    : <button
                        type="button"
                        onClick={() => void onMoveDish(product)}
                        className="flex-none rounded-xl bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-200"
                      >
                        Add here
                      </button>
                    }
                  </li>
                );
              })}
            </ul>
          }
        </section>
      )}
    </Modal>
  );
}
