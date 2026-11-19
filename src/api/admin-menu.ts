import type { Category, Product } from "../types/menu";
import { apiRequest } from "./client";

// Admin catalog from quickdish-api (#11, #25). Admin token required.
// `?all=true` includes inactive categories and unavailable products.

export type CategoryInput = {
  name: string;
  description?: string | null;
  active?: boolean;
};

export type ProductInput = {
  name: string;
  description?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  available?: boolean;
  categoryId: string;
};

export function listAllCategories() {
  return apiRequest<Category[]>("/categories?all=true");
}

export function createCategory(input: CategoryInput) {
  return apiRequest<Category>("/categories", { method: "POST", body: input });
}

export function updateCategory(id: string, input: Partial<CategoryInput>) {
  return apiRequest<Category>(`/categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input
  });
}

export function deleteCategory(id: string) {
  return apiRequest<void>(`/categories/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function listAllProducts() {
  return apiRequest<Product[]>("/products?all=true");
}

export function createProduct(input: ProductInput) {
  return apiRequest<Product>("/products", { method: "POST", body: input });
}

export function updateProduct(id: string, input: Partial<ProductInput>) {
  return apiRequest<Product>(`/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input
  });
}

export function setProductAvailability(id: string, available: boolean) {
  return apiRequest<Product>(
    `/products/${encodeURIComponent(id)}/availability`,
    { method: "PATCH", body: { available } }
  );
}

export function deleteProduct(id: string) {
  return apiRequest<void>(`/products/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

/** Uploads a dish photo (JPG, PNG or WebP, 1 MB max). Returns the updated dish. */
export function uploadProductPhoto(id: string, photo: Blob) {
  return apiRequest<Product>(`/products/${encodeURIComponent(id)}/image`, {
    method: "PUT",
    rawBody: photo
  });
}

/** Removes a dish photo. Returns the updated dish. */
export function removeProductPhoto(id: string) {
  return apiRequest<Product>(`/products/${encodeURIComponent(id)}/image`, {
    method: "DELETE"
  });
}
