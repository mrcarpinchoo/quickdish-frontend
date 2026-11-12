export type Category = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  /** Integer amount in cents (#4). */
  price: number;
  imageUrl: string;
  available: boolean;
  categoryId: string;
};
