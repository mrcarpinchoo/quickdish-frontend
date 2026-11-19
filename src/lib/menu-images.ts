import { appConfig } from "./config";

/**
 * Local photos for the menu, served from public/menu/. They take precedence
 * over the imageUrl the API returns. Keyed by product id, so a renamed product
 * must be updated here as well. Remove an entry once its photo is uploaded.
 */
const localImages: Record<string, string> = {
  "3c9e7a10-0002-4f2b-8e5a-000000000001": "/menu/pastor.jpg",
  "3c9e7a10-0002-4f2b-8e5a-000000000002": "/menu/asada.webp",
  "3c9e7a10-0002-4f2b-8e5a-000000000003": "/menu/coliflor.jpg",
  "3c9e7a10-0002-4f2b-8e5a-000000000004": "/menu/bowl-pollo.jpg",
  "3c9e7a10-0002-4f2b-8e5a-000000000005": "/menu/bowl-vegetariano.jpg",
  "3c9e7a10-0002-4f2b-8e5a-000000000007": "/menu/horchata.jpeg",
  "3c9e7a10-0002-4f2b-8e5a-000000000008": "/menu/jamaica.avif",
  "3c9e7a10-0002-4f2b-8e5a-000000000009": "/menu/cafe.jpeg",
  "3c9e7a10-0002-4f2b-8e5a-000000000010": "/menu/churros.jpg",
  "3c9e7a10-0002-4f2b-8e5a-000000000011": "/menu/flan.avif",
  "3c9e7a10-0002-4f2b-8e5a-000000000012": "/menu/tres-leches.jpg"
};

/**
 * Photo of a dish. An uploaded photo comes from the API as a path such as
 * `/products/<id>/image?v=1`, so it is joined to the API address.
 */
export function productImageUrl(product: {
  id: string;
  imageUrl: string | null;
}): string | null {
  const local = localImages[product.id];
  if (local) return local;
  if (product.imageUrl?.startsWith("/")) {
    return `${appConfig().apiUrl}${product.imageUrl}`;
  }
  return product.imageUrl;
}
