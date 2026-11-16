import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "../auth/AuthProvider";
import { CartProvider } from "../cart/CartProvider";
import { makeToken } from "./tokens";

type Options = {
  /** Path the router starts on. */
  route?: string;
  /** Signs the visitor in as this role; anonymous when omitted. */
  role?: "CUSTOMER" | "ADMIN";
};

/** Renders a screen inside the same providers as the app: auth, cart and router. */
export function renderWithProviders(
  ui: ReactNode,
  { route = "/", role }: Options = {}
) {
  if (role) {
    window.localStorage.setItem(
      "quickdish.token",
      makeToken({ role, sub: "user-1" })
    );
  }
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
}
