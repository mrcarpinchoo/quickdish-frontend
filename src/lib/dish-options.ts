/**
 * Choices a customer makes before adding a dish. Sizes are per dish.
 *
 * Sizes are placeholders for the team to confirm: they do not change the price.
 */

export const SIZE_OPTIONS: Record<string, string[]> = {
  // Drinks: horchata, jamaica, café americano.
  "3c9e7a10-0002-4f2b-8e5a-000000000007": [
    "Regular (500 ml)",
    "Grande (700 ml)"
  ],
  "3c9e7a10-0002-4f2b-8e5a-000000000008": [
    "Regular (500 ml)",
    "Grande (700 ml)"
  ],
  "3c9e7a10-0002-4f2b-8e5a-000000000009": ["Chico", "Grande"]
};

export function sizesFor(productId: string): string[] {
  return SIZE_OPTIONS[productId] ?? [];
}

/** The size as the text sent to the API in the cart item's notes. Undefined when there is no size. */
export function sizeNote(size?: string): string | undefined {
  return size ? `Size: ${size}` : undefined;
}
