import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addCartItem, getCart } from "../api/cart";
import { renderWithProviders } from "../test/render";
import type { Product } from "../types/menu";
import { AddToCartButton } from "./AddToCartButton";

vi.mock("../api/cart", () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn()
}));

const emptyCart = { id: "cart-1", items: [], totalCents: 0 };

const product: Product = {
  id: "prod-1",
  name: "Taco de asada",
  description: "Tres tortillas",
  priceCents: 4500,
  imageUrl: null,
  available: true,
  categoryId: "cat-1"
};

function renderButton(role?: "CUSTOMER", item: Product = product) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={<AddToCartButton product={item} />}
      />
      <Route
        path="/login"
        element={<h1>Sign in destination</h1>}
      />
    </Routes>,
    { route: "/", role }
  );
}

function openDialog(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole("button", { name: "Add to cart" }));
}

describe("AddToCartButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("asks anonymous visitors to sign in in a pop-up instead of leaving the page", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(
      await screen.findByRole("heading", {
        name: "¡Tu próximo antojo está a un paso!"
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Sign in destination" })
    ).not.toBeInTheDocument();
    expect(addCartItem).not.toHaveBeenCalled();
  });

  it("closes the dialog with Escape without adding anything", async () => {
    const user = userEvent.setup();
    vi.mocked(getCart).mockResolvedValue(emptyCart);
    renderButton("CUSTOMER");

    await openDialog(user);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("quickdish.guestCart")).toBeNull();
  });

  it("sends the chosen quantity for a signed-in customer", async () => {
    const user = userEvent.setup();
    vi.mocked(getCart).mockResolvedValue(emptyCart);
    vi.mocked(addCartItem).mockResolvedValue(emptyCart);
    renderButton("CUSTOMER");

    await user.click(
      await screen.findByRole("button", { name: "Add to cart" })
    );
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getByRole("button", { name: /Add 2 to order/ }));

    expect(addCartItem).toHaveBeenCalledWith(product.id, 2);
  });

  it("shows the reason when the API refuses the dish", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("../api/client");
    vi.mocked(getCart).mockResolvedValue(emptyCart);
    vi.mocked(addCartItem).mockRejectedValue(
      new ApiError(409, "PRODUCT_UNAVAILABLE", "Product is not available")
    );
    renderButton("CUSTOMER");

    await user.click(
      await screen.findByRole("button", { name: "Add to cart" })
    );
    await user.click(screen.getByRole("button", { name: /Add 1 to order/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A dish in your cart is not available right now. Remove it to continue."
    );
  });
});
