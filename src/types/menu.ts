// Shapes returned by quickdish-api's catalog (#11): the Prisma models as JSON.

export type Category = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  /** Integer amount in cents (#4). */
  priceCents: number;
  imageUrl: string | null;
  available: boolean;
  categoryId: string;
};
