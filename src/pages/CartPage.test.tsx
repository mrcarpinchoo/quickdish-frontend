import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCart, removeCartItem, updateCartItem } from "../api/cart";
import { ApiError } from "../api/client";
import { createOrder } from "../api/orders";
import { renderWithProviders } from "../test/render";
import type { Cart, CartItem } from "../types/cart";
import { CartPage } from "./CartPage";

vi.mock("../api/cart", () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn()
}));

vi.mock("../api/orders", () => ({
  createOrder: vi.fn(),
  listMyOrders: vi.fn(),
  getOrder: vi.fn(),
  cancelOrder: vi.fn()
}));

function item(overrides: Partial<CartItem> & { id: string }): CartItem {
  return {
    productId: "prod-1",
    quantity: 2,
    notes: null,
    subtotalCents: 7000,
    product: {
      id: "prod-1",
      name: "Taco al pastor",
      priceCents: 3500,
      imageUrl: null,
      available: true
    },
    ...overrides
  };
}

function cartWith(...items: CartItem[]): Cart {
  return {
    id: "cart-1",
    items,
    totalCents: items.reduce((sum, i) => sum + i.subtotalCents, 0)
  };
}

const pastor = item({ id: "ci-1" });
const horchata = item({
  id: "ci-2",
  productId: "prod-2",
  quantity: 1,
  subtotalCents: 4000,
  product: {
    id: "prod-2",
    name: "Horchata",
    priceCents: 4000,
    imageUrl: null,
    available: true
  }
});

function renderCart() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/cart"
        element={<CartPage />}
      />
      <Route
        path="/orders/:id"
        element={<h1>Order destination</h1>}
      />
    </Routes>,
    { route: "/cart", role: "CUSTOMER" }
  );
}

describe("CartPage", () => {
  beforeEach(() => {
    vi.mocked(getCart).mockResolvedValue(cartWith(pastor, horchata));
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("shows each item with its subtotal and the total from the API", async () => {
    renderCart();

    expect(
      await screen.findByRole("heading", { name: "Taco al pastor" })
    ).toBeInTheDocument();
    expect(screen.getByText(/70\.00/)).toBeInTheDocument();
    expect(screen.getByText(/110\.00/)).toBeInTheDocument();
  });

  it("sends the new quantity when the customer increases an item", async () => {
    const user = userEvent.setup();
    vi.mocked(updateCartItem).mockResolvedValue(
      cartWith(
        item({ id: "ci-1", quantity: 3, subtotalCents: 10500 }),
        horchata
      )
    );
    renderCart();

    await user.click(
      await screen.findByRole("button", {
        name: "Increase quantity of Taco al pastor"
      })
    );

    expect(updateCartItem).toHaveBeenCalledWith("ci-1", { quantity: 3 });
    expect(
      await screen.findByLabelText("Quantity of Taco al pastor")
    ).toHaveTextContent("3");
  });

  it("does not let the quantity go below 1; the customer removes the item instead", async () => {
    const user = userEvent.setup();
    vi.mocked(getCart).mockResolvedValue(
      cartWith(item({ id: "ci-1", quantity: 1, subtotalCents: 3500 }))
    );
    renderCart();

    const decrease = await screen.findByRole("button", {
      name: "Decrease quantity of Taco al pastor"
    });
    expect(decrease).toBeDisabled();

    vi.mocked(removeCartItem).mockResolvedValue(cartWith());
    await user.click(
      screen.getByRole("button", { name: "Remove Taco al pastor" })
    );

    expect(removeCartItem).toHaveBeenCalledWith("ci-1");
  });

  it("blocks checkout while an item is unavailable", async () => {
    vi.mocked(getCart).mockResolvedValue(
      cartWith(
        item({
          id: "ci-1",
          product: { ...pastor.product, available: false }
        }),
        horchata
      )
    );
    renderCart();

    expect(
      await screen.findByRole("button", { name: "Place order" })
    ).toBeDisabled();
    expect(
      screen.getByText(/Remove the dishes marked as unavailable/)
    ).toBeInTheDocument();
  });

  it("places the order and opens the order confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(createOrder).mockResolvedValue({
      id: "order-9",
      userId: "user-1",
      status: "PENDING",
      totalCents: 11000,
      notes: null,
      createdAt: "2026-11-15T10:00:00.000Z",
      items: []
    });
    renderCart();

    await user.click(
      await screen.findByRole("button", { name: "Place order" })
    );

    expect(createOrder).toHaveBeenCalledWith("");
    expect(
      await screen.findByRole("heading", { name: "Order destination" })
    ).toBeInTheDocument();
  });

  it("explains a 409 at checkout in plain words", async () => {
    const user = userEvent.setup();
    vi.mocked(createOrder).mockRejectedValue(
      new ApiError(
        409,
        "PRODUCT_UNAVAILABLE",
        "Some products are not available"
      )
    );
    renderCart();

    await user.click(
      await screen.findByRole("button", { name: "Place order" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A dish in your cart is not available right now. Remove it to continue."
    );
    expect(screen.queryByText("Order destination")).not.toBeInTheDocument();
  });

  it("shows an empty state with a way back to the menu", async () => {
    vi.mocked(getCart).mockResolvedValue(cartWith());
    renderCart();

    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse the menu" })
    ).toBeInTheDocument();
  });
});
