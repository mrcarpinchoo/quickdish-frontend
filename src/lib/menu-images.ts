/**
 * Local photos for the menu, served from public/menu/. They take precedence
 * over the imageUrl the API returns (placeholders today). Keyed by product id,
 * so a renamed product must be updated here as well.
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

export function productImageUrl(product: {
  id: string;
  imageUrl: string | null;
}): string | null {
  return localImages[product.id] ?? product.imageUrl;
}
