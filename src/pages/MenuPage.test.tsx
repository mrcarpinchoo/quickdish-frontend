import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/render";
import { MenuPage } from "./MenuPage";

describe("MenuPage", () => {
  it("shows every product by default", () => {
    renderWithProviders(<MenuPage />);

    expect(
      screen.getByRole("heading", { name: "Guacamole con totopos" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tacos al pastor" })
    ).toBeInTheDocument();
  });

  it("filters the products by category", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MenuPage />);

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

  it("disables the add button for unavailable products", () => {
    renderWithProviders(<MenuPage />);

    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });
});
