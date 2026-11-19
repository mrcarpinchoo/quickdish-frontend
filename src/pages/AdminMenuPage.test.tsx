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

/** Opens a dialog and returns it, so its fields can be found inside it. */
async function openDialog(button: string) {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: button }));
  return { user, dialog: await screen.findByRole("dialog") };
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

  it("shows each dish with its category and price, and counts the tabs", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Tacos al pastor" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Bebidas").length).toBeGreaterThan(0);
    expect(screen.getByText("MX$35.00")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Dishes (1)" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Categories (1)" })
    ).toBeInTheDocument();
  });

  it("creates a dish from the New dish pop-up with the price in cents", async () => {
    vi.mocked(createProduct).mockResolvedValue(tacos);
    renderPage();

    const { user, dialog } = await openDialog("+ New dish");
    await user.type(within(dialog).getByLabelText("Name"), "Quesadilla");
    await user.type(within(dialog).getByLabelText("Price (MXN)"), "42.50");
    await user.click(
      within(dialog).getByRole("button", { name: "Create dish" })
    );

    await waitFor(() =>
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Quesadilla",
          priceCents: 4250,
          categoryId: "cat-1",
          available: true
        })
      )
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Dish created."
    );
  });

  it("explains a price that is not a positive amount, without calling the API", async () => {
    renderPage();

    const { user, dialog } = await openDialog("+ New dish");
    await user.type(within(dialog).getByLabelText("Name"), "Agua");
    await user.type(within(dialog).getByLabelText("Price (MXN)"), "abc");
    await user.click(
      within(dialog).getByRole("button", { name: "Create dish" })
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Enter a price in pesos"
    );
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("marks a dish sold out with one click", async () => {
    vi.mocked(setProductAvailability).mockResolvedValue({
      ...tacos,
      available: false
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Mark sold out" })
    );

    expect(setProductAvailability).toHaveBeenCalledWith("prod-1", false);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Tacos al pastor is now hidden from customers."
    );
  });

  it("shows the API's message when a change fails", async () => {
    vi.mocked(setProductAvailability).mockRejectedValue(
      new ApiError(500, "SERVER_ERROR", "Could not save the change")
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Mark sold out" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save the change"
    );
  });

  it("edits a dish and sends the new price in cents", async () => {
    vi.mocked(updateProduct).mockResolvedValue(tacos);
    renderPage();

    const { user, dialog } = await openDialog("Edit");
    const price = within(dialog).getByLabelText("Price (MXN)");
    await user.clear(price);
    await user.type(price, "40");
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    );

    await waitFor(() =>
      expect(updateProduct).toHaveBeenCalledWith(
        "prod-1",
        expect.objectContaining({ priceCents: 4000 })
      )
    );
  });

  it("creates a category from the New category pop-up", async () => {
    vi.mocked(createCategory).mockResolvedValue({
      id: "cat-2",
      name: "Postres",
      description: null,
      active: true
    });
    renderPage();

    const { user, dialog } = await openDialog("+ New category");
    await user.type(within(dialog).getByLabelText("Name"), "Postres");
    await user.click(
      within(dialog).getByRole("button", { name: "Create category" })
    );

    await waitFor(() =>
      expect(createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Postres" })
      )
    );
  });

  it("hides a category from the menu when asked", async () => {
    vi.mocked(updateCategory).mockResolvedValue({ ...bebidas, active: false });
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("tab", { name: "Categories (1)" })
    );
    await user.click(
      await screen.findByRole("button", { name: "Hide from menu" })
    );

    expect(updateCategory).toHaveBeenCalledWith("cat-1", { active: false });
  });

  it("moves a dish into a category from the category pop-up", async () => {
    vi.mocked(listAllCategories).mockResolvedValue([
      bebidas,
      { id: "cat-2", name: "Tacos", description: null, active: true }
    ]);
    vi.mocked(updateProduct).mockResolvedValue(tacos);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("tab", { name: "Categories (2)" })
    );
    await user.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Add here" }));

    await waitFor(() =>
      expect(updateProduct).toHaveBeenCalledWith("prod-1", {
        categoryId: "cat-2"
      })
    );
  });

  it("does not delete a dish when the confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(deleteProduct).not.toHaveBeenCalled();
  });
});
