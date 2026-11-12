import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiRequest,
  setAuthToken,
  setUnauthorizedHandler
} from "./client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("apiRequest", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://api.test");
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    setAuthToken(null);
    setUnauthorizedHandler(null);
  });

  it("prefixes the path with VITE_API_URL and parses the JSON body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "ok" }));

    await expect(apiRequest<{ status: string }>("/health")).resolves.toEqual({
      status: "ok"
    });
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/health");
  });

  it("sends the bearer token and a JSON body when they are set", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 201));
    setAuthToken("abc");

    await apiRequest("/orders", {
      method: "POST",
      body: { notes: "sin cebolla" }
    });

    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(init?.method).toBe("POST");
    expect(headers.get("Authorization")).toBe("Bearer abc");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe('{"notes":"sin cebolla"}');
  });

  it("throws an ApiError with the code and message from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "product_unavailable",
            message: "Producto no disponible"
          }
        },
        409
      )
    );

    const error = await apiRequest("/cart/items", {
      method: "POST",
      body: {}
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "product_unavailable",
      message: "Producto no disponible"
    });
  });

  it("falls back to a generic error when the body has another shape", async () => {
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

    await expect(apiRequest("/health")).rejects.toMatchObject({
      status: 502,
      code: "unknown_error"
    });
  });

  it("runs the unauthorized handler on 401", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: "unauthorized", message: "Sesión expirada" } },
        401
      )
    );
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    await expect(apiRequest("/users/me")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("returns undefined for 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      apiRequest("/cart", { method: "DELETE" })
    ).resolves.toBeUndefined();
  });
});
