import type { Category, Product } from "../types/menu";

// Mock data for the menu screens until the API endpoints reach Dev (#11).
// Shape follows the contract in #4; the ids are strings until Ale's schema
// fixes them.

export const mockCategories: Category[] = [
  {
    id: "cat-entradas",
    name: "Entradas",
    description: "Para compartir",
    active: true
  },
  {
    id: "cat-fuertes",
    name: "Platos fuertes",
    description: "Lo más pedido",
    active: true
  },
  {
    id: "cat-bebidas",
    name: "Bebidas",
    description: "Frías y calientes",
    active: true
  }
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Guacamole con totopos",
    description: "Aguacate, cilantro, limón y chile serrano.",
    price: 11000,
    imageUrl: "",
    available: true,
    categoryId: "cat-entradas"
  },
  {
    id: "prod-2",
    name: "Sopa de tortilla",
    description: "Caldo de jitomate, chile pasilla, aguacate y queso fresco.",
    price: 9500,
    imageUrl: "",
    available: true,
    categoryId: "cat-entradas"
  },
  {
    id: "prod-3",
    name: "Tacos al pastor",
    description: "Cerdo marinado, piña, cebolla y cilantro.",
    price: 16500,
    imageUrl: "",
    available: true,
    categoryId: "cat-fuertes"
  },
  {
    id: "prod-4",
    name: "Enchiladas verdes",
    description: "Pollo deshebrado, salsa verde y crema.",
    price: 18900,
    imageUrl: "",
    available: false,
    categoryId: "cat-fuertes"
  },
  {
    id: "prod-5",
    name: "Agua de horchata",
    description: "Arroz, canela y leche de almendra.",
    price: 4500,
    imageUrl: "",
    available: true,
    categoryId: "cat-bebidas"
  },
  {
    id: "prod-6",
    name: "Café de olla",
    description: "Piloncillo y canela.",
    price: 4000,
    imageUrl: "",
    available: true,
    categoryId: "cat-bebidas"
  }
];
