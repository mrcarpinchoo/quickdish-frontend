import { ApiError } from "../api/client";

/** The text to show the user for any failed request. */
export function errorMessage(caught: unknown): string {
  if (caught instanceof ApiError) return caught.message;
  return "Could not reach the API.";
}

/** Cart and order errors, with clearer text for the codes from quickdish-api#6. */
const CART_MESSAGES: Record<string, string> = {
  PRODUCT_UNAVAILABLE:
    "A dish in your cart is not available right now. Remove it to continue.",
  QUANTITY_LIMIT: "You can order at most 20 units of a dish.",
  CART_EMPTY: "Your cart is empty.",
  CART_CHANGED:
    "Your cart changed while placing the order. Review it and try again.",
  ORDER_NOT_CANCELLABLE: "Only pending orders can be cancelled."
};

export function cartErrorMessage(caught: unknown): string {
  if (caught instanceof ApiError && CART_MESSAGES[caught.code]) {
    return CART_MESSAGES[caught.code] ?? errorMessage(caught);
  }
  return errorMessage(caught);
}
