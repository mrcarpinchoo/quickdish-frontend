import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addCartItem, getCart } from "../api/cart";
import { renderWithProviders } from "../test/render";
import { AddToCartButton } from "./AddToCartButton";

vi.mock("../api/cart", () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn()
}));

const emptyCart = { id: "cart-1", items: [], totalCents: 0 };

function renderButton(role?: "CUSTOMER") {
  return renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <AddToCartButton
            productId="prod-1"
            available
          />
        }
      />
      <Route
        path="/login"
        element={<h1>Sign in destination</h1>}
      />
    </Routes>,
    { route: "/", role }
  );
}

describe("AddToCartButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("sends anonymous visitors to sign in before adding", async () => {
    const user = userEvent.setup();
    vi.mocked(getCart).mockResolvedValue(emptyCart);
    renderButton();

    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(addCartItem).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "Sign in destination" })
    ).toBeInTheDocument();
  });

  it("adds one unit for a signed-in customer", async () => {
    const user = userEvent.setup();
    vi.mocked(getCart).mockResolvedValue(emptyCart);
    vi.mocked(addCartItem).mockResolvedValue({
      id: "cart-1",
      items: [],
      totalCents: 0
    });
    renderButton("CUSTOMER");

    await user.click(
      await screen.findByRole("button", { name: "Add to cart" })
    );

    expect(addCartItem).toHaveBeenCalledWith("prod-1");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Added to your cart"
    );
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A dish in your cart is not available right now. Remove it to continue."
    );
  });
});
