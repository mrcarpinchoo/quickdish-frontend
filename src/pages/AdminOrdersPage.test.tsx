import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { advanceOrder, listAllOrders } from "../api/admin-orders";
import { ApiError } from "../api/client";
import { renderWithProviders } from "../test/render";
import type { AdminOrder, OrderStatus } from "../types/orders";
import { AdminOrdersPage } from "./AdminOrdersPage";

vi.mock("../api/admin-orders", () => ({
  listAllOrders: vi.fn(),
  advanceOrder: vi.fn()
}));

function order(id: string, status: OrderStatus): AdminOrder {
  return {
    id,
    userId: "user-1",
    status,
    totalCents: 7000,
    notes: null,
    createdAt: "2026-11-15T10:00:00.000Z",
    customer: { id: "user-1", name: "Ana", email: "ana@example.com" },
    items: [
      {
        id: `${id}-item`,
        productId: "prod-1",
        name: "Taco al pastor",
        imageUrl: null,
        quantity: 2,
        unitPriceCents: 3500,
        subtotalCents: 7000,
        notes: "sin cebolla"
      }
    ]
  };
}

function column(title: string) {
  return screen.getByRole("region", { name: title });
}

describe("AdminOrdersPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("groups orders into columns by status", async () => {
    vi.mocked(listAllOrders).mockResolvedValue([
      order("aaaa1111", "PENDING"),
      order("bbbb2222", "READY")
    ]);
    renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders" });

    const pending = column("Pending");
    expect(
      await within(pending).findByRole("article", { name: "Order aaaa1111" })
    ).toBeInTheDocument();
    expect(
      within(column("Ready")).getByRole("article", { name: "Order bbbb2222" })
    ).toBeInTheDocument();
    expect(
      within(column("In preparation")).getByText("No orders.")
    ).toBeInTheDocument();
  });

  it("shows the customer, items and notes on each card", async () => {
    vi.mocked(listAllOrders).mockResolvedValue([order("aaaa1111", "PENDING")]);
    renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders" });

    const card = await screen.findByRole("article", { name: "Order aaaa1111" });
    expect(within(card).getByText("Ana")).toBeInTheDocument();
    expect(within(card).getByText(/2 × Taco al pastor/)).toBeInTheDocument();
    expect(within(card).getByText(/sin cebolla/)).toBeInTheDocument();
  });

  it("advances an order to the next status and moves its card", async () => {
    const user = userEvent.setup();
    vi.mocked(listAllOrders).mockResolvedValue([order("aaaa1111", "PENDING")]);
    vi.mocked(advanceOrder).mockResolvedValue(
      order("aaaa1111", "IN_PREPARATION")
    );
    renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders" });

    await user.click(await screen.findByRole("button", { name: "Advance" }));

    expect(advanceOrder).toHaveBeenCalledWith("aaaa1111", "IN_PREPARATION");
    expect(
      await within(column("In preparation")).findByRole("article", {
        name: "Order aaaa1111"
      })
    ).toBeInTheDocument();
    expect(
      within(column("Pending")).getByText("No orders.")
    ).toBeInTheDocument();
  });

  it("shows the API's message when a move is refused", async () => {
    const user = userEvent.setup();
    vi.mocked(listAllOrders).mockResolvedValue([order("aaaa1111", "READY")]);
    vi.mocked(advanceOrder).mockRejectedValue(
      new ApiError(
        409,
        "ORDER_STATUS_CHANGED",
        "The order changed while you were updating it; reload and try again"
      )
    );
    renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders" });

    await user.click(await screen.findByRole("button", { name: "Advance" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The order changed while you were updating it; reload and try again"
    );
  });

  it("has no advance button for delivered orders", async () => {
    vi.mocked(listAllOrders).mockResolvedValue([
      order("aaaa1111", "DELIVERED")
    ]);
    renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders" });

    await screen.findByRole("article", { name: "Order aaaa1111" });
    expect(
      screen.queryByRole("button", { name: "Advance" })
    ).not.toBeInTheDocument();
  });
});
