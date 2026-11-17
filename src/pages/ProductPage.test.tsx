import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProduct } from "../api/menu";
import { ApiError } from "../api/client";
import { renderWithProviders } from "../test/render";
import type { Product } from "../types/menu";
import { ProductPage } from "./ProductPage";

vi.mock("../api/menu", () => ({
  listCategories: vi.fn(),
  listProducts: vi.fn(),
  getProduct: vi.fn()
}));

const enchiladas: Product = {
  id: "prod-4",
  name: "Enchiladas verdes",
  description: "Pollo deshebrado, salsa verde y crema.",
  priceCents: 18900,
  imageUrl: null,
  available: false,
  categoryId: "cat-fuertes"
};

function renderProduct(path: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/products/:id"
        element={<ProductPage />}
      />
    </Routes>,
    { route: path }
  );
}

describe("ProductPage", () => {
  beforeEach(() => {
    vi.mocked(getProduct).mockReset();
  });

  it("shows the product and disables the button when it is unavailable", async () => {
    vi.mocked(getProduct).mockResolvedValue(enchiladas);
    renderProduct("/products/prod-4");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Enchiladas verdes"
      })
    ).toBeInTheDocument();
    expect(getProduct).toHaveBeenCalledWith("prod-4");
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });

  it("shows a message for an unknown product", async () => {
    vi.mocked(getProduct).mockRejectedValue(
      new ApiError(404, "NOT_FOUND", "Product not found")
    );
    renderProduct("/products/no-existe");

    expect(
      await screen.findByText("This dish does not exist.")
    ).toBeInTheDocument();
  });

  it("shows the API error for other failures", async () => {
    vi.mocked(getProduct).mockRejectedValue(
      new Error("Could not reach the API.")
    );
    renderProduct("/products/prod-4");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not reach the API."
    );
  });
});
