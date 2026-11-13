import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { makeToken } from "./test/tokens";

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://api.test");
    vi.stubEnv("VITE_ENV", "DEV");
    vi.stubEnv("VITE_VERSION", "a1b2c3d");
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockImplementation(() =>
          Promise.resolve(new Response('{"status":"ok"}', { status: 200 }))
        )
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("renders the menu at / with the environment badge and API status", async () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { level: 1, name: "Menu" })
    ).toBeInTheDocument();
    expect(screen.getByText("DEV · a1b2c3d")).toBeInTheDocument();
    expect(await screen.findByText("API online")).toBeInTheDocument();
  });

  it("sends anonymous visitors from /cart to the login page", () => {
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
