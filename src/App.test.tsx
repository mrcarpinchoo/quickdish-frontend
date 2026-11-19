import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { makeToken } from "./test/tokens";
import { renderWithProviders } from "./test/render";

vi.mock("./api/cart", () => ({
  getCart: vi
    .fn()
    .mockResolvedValue({ id: "cart-1", items: [], totalCents: 0 }),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn()
}));

function renderAt(path: string) {
  return renderWithProviders(<App />, { route: path });
}

describe("App", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://api.test");
    vi.stubEnv("VITE_ENV", "DEV");
    vi.stubEnv("VITE_VERSION", "a1b2c3d");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(input => {
        const url =
          typeof input === "string" ? input
          : input instanceof URL ? input.href
          : input.url;
        // The menu reads the catalog; it is empty in these screen tests.
        const body =
          url.includes("/categories") || url.includes("/products") ?
            "[]"
          : '{"status":"ok"}';
        return Promise.resolve(new Response(body, { status: 200 }));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("opens straight on the menu at / for anonymous visitors", async () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { level: 1, name: "Menu" })
    ).toBeInTheDocument();
    expect(screen.getByText("DEV · a1b2c3d")).toBeInTheDocument();
    expect(await screen.findByText("API online")).toBeInTheDocument();
  });

  it("lets anonymous visitors browse the menu at /menu", async () => {
    renderAt("/menu");

    expect(
      screen.getByRole("heading", { level: 1, name: "Menu" })
    ).toBeInTheDocument();
    expect(await screen.findByText("API online")).toBeInTheDocument();
  });

  it("renders the menu at /menu for signed-in customers with the API status", async () => {
    window.localStorage.setItem(
      "quickdish.token",
      makeToken({ role: "CUSTOMER" })
    );
    renderAt("/menu");

    expect(
      screen.getByRole("heading", { level: 1, name: "Menu" })
    ).toBeInTheDocument();
    expect(await screen.findByText("API online")).toBeInTheDocument();
  });

  it("sends anonymous visitors from /cart to the sign-in page", () => {
    renderAt("/cart");

    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in" })
    ).toBeInTheDocument();
  });

  it("keeps customers out of the admin pages", () => {
    window.localStorage.setItem(
      "quickdish.token",
      makeToken({ role: "CUSTOMER" })
    );

    renderAt("/admin/orders");

    expect(
      screen.getByRole("heading", { level: 1, name: "Menu" })
    ).toBeInTheDocument();
  });

  it("lets admins into the admin pages", () => {
    window.localStorage.setItem(
      "quickdish.token",
      makeToken({ role: "ADMIN" })
    );

    renderAt("/admin/orders");

    expect(
      screen.getByRole("heading", { level: 1, name: "Orders" })
    ).toBeInTheDocument();
  });
});
