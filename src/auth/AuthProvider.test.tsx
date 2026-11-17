import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCart } from "../api/cart";
import { makeToken } from "../test/tokens";
import { AuthProvider } from "./AuthProvider";

// Runs a request from a child effect, the way CartProvider loads /cart.
function LoadsCart() {
  useEffect(() => {
    void getCart();
  }, []);
  return null;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockImplementation(() =>
          Promise.resolve(new Response("{}", { status: 200 }))
        )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("sends the stored token on the first request from a child effect", async () => {
    window.localStorage.setItem(
      "quickdish.token",
      makeToken({ role: "CUSTOMER" })
    );

    render(
      <AuthProvider>
        <LoadsCart />
      </AuthProvider>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("Authorization")).toMatch(/^Bearer /);
  });
});
