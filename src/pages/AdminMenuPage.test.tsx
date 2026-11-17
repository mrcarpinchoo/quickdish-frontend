import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCategory,
  createProduct,
  deleteProduct,
  listAllCategories,
  listAllProducts,
  setProductAvailability,
  updateCategory,
  updateProduct
} from "../api/admin-menu";
import { ApiError } from "../api/client";
import { renderWithProviders } from "../test/render";
import type { Category, Product } from "../types/menu";
import { AdminMenuPage } from "./AdminMenuPage";

vi.mock("../api/admin-menu", () => ({
  listAllCategories: vi.fn(),
  listAllProducts: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  updateProduct: vi.fn(),
  deleteCategory: vi.fn(),
  createProduct: vi.fn(),
  setProductAvailability: vi.fn(),
  deleteProduct: vi.fn()
}));

const bebidas: Category = {
  id: "cat-1",
  name: "Bebidas",
  description: null,
  active: true
};

const tacos: Product = {
  id: "prod-1",
  name: "Tacos al pastor",
  description: null,
  priceCents: 3500,
  imageUrl: null,
  available: true,
  categoryId: "cat-1"
};

function renderPage() {
  return renderWithProviders(<AdminMenuPage />, {
    route: "/admin/menu",
    role: "ADMIN"
  });
}

describe("AdminMenuPage", () => {
  beforeEach(() => {
    vi.mocked(listAllCategories).mockResolvedValue([bebidas]);
    vi.mocked(listAllProducts).mockResolvedValue([tacos]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("lists every category and dish, including inactive ones", async () => {
    renderPage();

    expect(await screen.findByText("Tacos al pastor")).toBeInTheDocument();
    const categories = screen.getByRole("region", { name: "Categories" });
    expect(within(categories).getByText("Bebidas")).toBeInTheDocument();
    expect(listAllCategories).toHaveBeenCalled();
    expect(listAllProducts).toHaveBeenCalled();
  });

  it("creates a category and reloads the list", async () => {
    const user = userEvent.setup();
    vi.mocked(createCategory).mockResolvedValue({
      ...bebidas,
      id: "cat-2",
      name: "Postres"
    });
    renderPage();
    await screen.findByText("Tacos al pastor");

    await user.type(screen.getByLabelText("Category name"), "Postres");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    await waitFor(() =>
      expect(createCategory).toHaveBeenCalledWith({ name: "Postres" })
    );
    expect(listAllCategories).toHaveBeenCalledTimes(2);
  });

  it("creates a dish with the price converted to cents", async () => {
    const user = userEvent.setup();
    vi.mocked(createProduct).mockResolvedValue(tacos);
    renderPage();
    await screen.findByText("Tacos al pastor");

    await user.type(screen.getByLabelText("Dish name"), "Café de olla");
    await user.type(screen.getByLabelText("Price (MXN)"), "35.50");
    await user.click(screen.getByRole("button", { name: "Add dish" }));

    await waitFor(() =>
      expect(createProduct).toHaveBeenCalledWith({
        name: "Café de olla",
        priceCents: 3550,
        categoryId: "cat-1",
        available: true
      })
    );
  });

  it("rejects a price that is not a positive amount in pesos", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Tacos al pastor");

    await user.type(screen.getByLabelText("Dish name"), "Agua");
    await user.type(screen.getByLabelText("Price (MXN)"), "abc");
    await user.click(screen.getByRole("button", { name: "Add dish" }));

    expect(
      await screen.findByText(
        "Enter a price in pesos, for example 35 or 35.50."
      )
    ).toBeInTheDocument();
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("marks a dish unavailable", async () => {
    const user = userEvent.setup();
    vi.mocked(setProductAvailability).mockResolvedValue({
      ...tacos,
      available: false
    });
    renderPage();
    const row = (await screen.findByText("Tacos al pastor")).closest("li");
    expect(row).not.toBeNull();

    await user.click(
      within(row!).getByRole("button", { name: "Mark unavailable" })
    );

    expect(setProductAvailability).toHaveBeenCalledWith("prod-1", false);
  });

  it("deactivates a category after confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(updateCategory).mockResolvedValue({ ...bebidas, active: false });
    renderPage();
    await screen.findByText("Tacos al pastor");

    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(updateCategory).toHaveBeenCalledWith("cat-1", { active: false });
  });

  it("does not delete a dish when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false)
    );
    renderPage();
    await screen.findByText("Tacos al pastor");

    const row = screen.getByText("Tacos al pastor").closest("li");
    await user.click(within(row!).getByRole("button", { name: "Delete" }));

    expect(deleteProduct).not.toHaveBeenCalled();
  });

  it("shows the API's message when a change fails", async () => {
    const user = userEvent.setup();
    vi.mocked(setProductAvailability).mockRejectedValue(
      new ApiError(409, "PRODUCT_IN_USE", "This dish is in an open order.")
    );
    renderPage();
    const row = (await screen.findByText("Tacos al pastor")).closest("li");

    await user.click(
      within(row!).getByRole("button", { name: "Mark unavailable" })
    );

    expect(
      await screen.findByText("This dish is in an open order.")
    ).toBeInTheDocument();
  });
  it("edits a dish and sends the new price in cents", async () => {
    const user = userEvent.setup();
    vi.mocked(updateProduct).mockResolvedValue({ ...tacos, priceCents: 4000 });
    renderPage();
    const row = (await screen.findByText("Tacos al pastor")).closest("li");

    await user.click(within(row!).getByRole("button", { name: "Edit" }));
    const form = screen.getByRole("form", { name: "Edit dish" });
    const price = within(form).getByLabelText("Price (MXN)");
    await user.clear(price);
    await user.type(price, "40");
    await user.click(within(form).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateProduct).toHaveBeenCalledWith("prod-1", {
        name: "Tacos al pastor",
        description: null,
        priceCents: 4000,
        imageUrl: null,
        categoryId: "cat-1"
      })
    );
  });

  it("renames a category", async () => {
    const user = userEvent.setup();
    vi.mocked(updateCategory).mockResolvedValue({ ...bebidas, name: "Aguas" });
    renderPage();
    await screen.findByText("Tacos al pastor");

    const categories = screen.getByRole("region", { name: "Categories" });
    await user.click(within(categories).getByRole("button", { name: "Edit" }));
    const form = screen.getByRole("form", { name: "Edit category" });
    const name = within(form).getByLabelText("Category name");
    await user.clear(name);
    await user.type(name, "Aguas");
    await user.click(within(form).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateCategory).toHaveBeenCalledWith("cat-1", {
        name: "Aguas",
        description: null
      })
    );
  });
});
