import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listCategories, listProducts } from "../api/menu";
import { renderWithProviders } from "../test/render";
import type { Category, Product } from "../types/menu";
import { MenuPage } from "./MenuPage";

vi.mock("../api/menu", () => ({
  listCategories: vi.fn(),
  listProducts: vi.fn(),
  getProduct: vi.fn()
}));

const categories: Category[] = [
  {
    id: "cat-fuertes",
    name: "Platos fuertes",
    description: null,
    active: true
  },
  { id: "cat-bebidas", name: "Bebidas", description: null, active: true }
];

const products: Product[] = [
  {
    id: "prod-1",
    name: "Tacos al pastor",
    description: "Cerdo marinado, piña y cilantro.",
    priceCents: 16500,
    imageUrl: null,
    available: true,
    categoryId: "cat-fuertes"
  },
  {
    id: "prod-2",
    name: "Café de olla",
    description: null,
    priceCents: 4500,
    imageUrl: null,
    available: false,
    categoryId: "cat-bebidas"
  }
];

describe("MenuPage", () => {
  beforeEach(() => {
    vi.mocked(listCategories).mockResolvedValue(categories);
    vi.mocked(listProducts).mockResolvedValue(products);
  });

  it("shows a loading message, then every product", async () => {
    renderWithProviders(<MenuPage />);

    expect(screen.getByText("Loading menu…")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Tacos al pastor" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Café de olla" })
    ).toBeInTheDocument();
  });

  it("filters the products by category", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MenuPage />);
    await screen.findByRole("heading", { name: "Tacos al pastor" });

    await user.click(screen.getByRole("button", { name: "Bebidas" }));

    expect(
      screen.getByRole("heading", { name: "Café de olla" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Tacos al pastor" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bebidas" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("shows the price in pesos from priceCents", async () => {
    renderWithProviders(<MenuPage />);

    expect(await screen.findByText("MX$165.00")).toBeInTheDocument();
  });

  it("disables the add button for unavailable products", async () => {
    renderWithProviders(<MenuPage />);

    expect(
      await screen.findByRole("button", { name: "Unavailable" })
    ).toBeDisabled();
  });

  it("shows the API error when the menu cannot load", async () => {
    vi.mocked(listProducts).mockRejectedValue(
      new Error("Could not reach the API.")
    );
    renderWithProviders(<MenuPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not reach the API."
    );
  });
});
