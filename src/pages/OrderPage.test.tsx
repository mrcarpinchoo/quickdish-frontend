import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelOrder, getOrder } from "../api/orders";
import { renderWithProviders } from "../test/render";
import type { Order, OrderStatus } from "../types/orders";
import { OrderPage } from "./OrderPage";

vi.mock("../api/cart", () => ({
  getCart: vi
    .fn()
    .mockResolvedValue({ id: "cart-1", items: [], totalCents: 0 }),
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

function order(status: OrderStatus): Order {
  return {
    id: "order-1",
    userId: "user-1",
    status,
    totalCents: 7000,
    notes: null,
    createdAt: "2026-11-15T10:00:00.000Z",
    items: [
      {
        id: "oi-1",
        productId: "prod-1",
        name: "Taco al pastor",
        imageUrl: null,
        quantity: 2,
        unitPriceCents: 3500,
        subtotalCents: 7000,
        notes: null
      }
    ]
  };
}

function renderOrder() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/orders/:id"
        element={<OrderPage />}
      />
    </Routes>,
    { route: "/orders/order-1", role: "CUSTOMER" }
  );
}

describe("OrderPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  beforeEach(() => {
    vi.mocked(getOrder).mockResolvedValue(order("PENDING"));
  });

  it("shows the price paid, not the dish's current price", async () => {
    renderOrder();

    expect(
      await screen.findByText(/35\.00 each, price paid/)
    ).toBeInTheDocument();
  });

  it("offers cancel while the order is PENDING", async () => {
    renderOrder();

    expect(
      await screen.findByRole("button", { name: "Cancel order" })
    ).toBeInTheDocument();
  });

  it.each(["IN_PREPARATION", "READY", "DELIVERED", "CANCELLED"] as const)(
    "hides cancel for a %s order",
    async status => {
      vi.mocked(getOrder).mockResolvedValue(order(status));
      renderOrder();

      await screen.findByText(/price paid/);
      expect(
        screen.queryByRole("button", { name: "Cancel order" })
      ).not.toBeInTheDocument();
    }
  );

  it("shows the new status after cancelling", async () => {
    const user = userEvent.setup();
    vi.mocked(cancelOrder).mockResolvedValue(order("CANCELLED"));
    renderOrder();

    await user.click(
      await screen.findByRole("button", { name: "Cancel order" })
    );

    expect(cancelOrder).toHaveBeenCalledWith("order-1");
    expect(await screen.findByText("Cancelled")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel order" })
    ).not.toBeInTheDocument();
  });

  it("shows a message when the order can no longer be cancelled", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("../api/client");
    vi.mocked(cancelOrder).mockRejectedValue(
      new ApiError(409, "ORDER_NOT_CANCELLABLE", "Only pending orders")
    );
    renderOrder();

    await user.click(
      await screen.findByRole("button", { name: "Cancel order" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only pending orders can be cancelled."
    );
  });
});
