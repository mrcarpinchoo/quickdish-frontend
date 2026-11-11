import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { makeToken } from "../test/tokens";
import { LoginPage } from "./LoginPage";

function renderLogin(state?: unknown) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{ pathname: "/login", state }]}>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage />}
          />
          <Route
            path="/cart"
            element={<h1>Destino carrito</h1>}
          />
          <Route
            path="/"
            element={<h1>Destino menú</h1>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Correo"), email);
  await user.type(screen.getByLabelText("Contraseña"), password);
  await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
}

describe("LoginPage", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://api.test");
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    window.localStorage.clear();
  });

  it("rejects an invalid email without calling the API", async () => {
    renderLogin();

    await fillAndSubmit("no-es-correo", "secreto123");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Escribe un correo válido."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the API message when the credentials are wrong", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "invalid_credentials",
            message: "Correo o contraseña incorrectos."
          }
        }),
        { status: 401 }
      )
    );
    renderLogin();

    await fillAndSubmit("ana@example.com", "mal");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Correo o contraseña incorrectos."
    );
  });

  it("stores the token and returns to the page the user wanted", async () => {
    const token = makeToken({ role: "CUSTOMER" });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token }), { status: 200 })
    );
    renderLogin({ from: "/cart" });

    await fillAndSubmit("ana@example.com", "secreto123");

    expect(
      await screen.findByRole("heading", { name: "Destino carrito" })
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("quickdish.token")).toBe(token);
  });
});
