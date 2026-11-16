import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/render";
import { ProductPage } from "./ProductPage";

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
  it("shows the product and disables the button when it is unavailable", () => {
    renderProduct("/products/prod-4");

    expect(
      screen.getByRole("heading", { level: 1, name: "Enchiladas verdes" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });

  it("shows a message for an unknown product", () => {
    renderProduct("/products/no-existe");

    expect(screen.getByText("This dish does not exist.")).toBeInTheDocument();
  });
});
