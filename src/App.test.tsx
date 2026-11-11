import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
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
  });

  it("renders the menu at / with the environment badge and API status", async () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { level: 1, name: "Menú" })
    ).toBeInTheDocument();
    expect(screen.getByText("DEV · a1b2c3d")).toBeInTheDocument();
    expect(await screen.findByText("API en línea")).toBeInTheDocument();
  });

  it("renders a placeholder for routes that are not built yet", () => {
    renderAt("/cart");

    expect(
      screen.getByRole("heading", { level: 1, name: "Carrito" })
    ).toBeInTheDocument();
  });
});
