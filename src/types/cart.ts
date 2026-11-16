/** Product as the cart returns it, with the price it has now (#6). */
export type CartProduct = {
  id: string;
  name: string;
  /** Integer amount in cents. */
  priceCents: number;
  imageUrl: string | null;
  /** False when the dish was hidden after being added: the order would fail. */
  available: boolean;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  notes: string | null;
  subtotalCents: number;
  product: CartProduct;
};

export type Cart = {
  id: string;
  items: CartItem[];
  totalCents: number;
};

/** Units of one dish allowed in the cart. Matches MAX_QUANTITY in the API. */
export const MAX_QUANTITY = 20;
