import type { Category, Product } from "../types/menu";
import { apiRequest } from "./client";

// Public catalog from quickdish-api (#11). No token needed. The API returns
// only available dishes of active categories to customers.

export function listCategories() {
  return apiRequest<Category[]>("/categories");
}

export function listProducts() {
  return apiRequest<Product[]>("/products");
}

export function getProduct(id: string) {
  return apiRequest<Product>(`/products/${encodeURIComponent(id)}`);
}
