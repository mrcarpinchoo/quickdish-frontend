import { afterEach, describe, expect, it, vi } from "vitest";
import { productImageUrl } from "./menu-images";

describe("productImageUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("joins an uploaded photo path to the API address", () => {
    vi.stubEnv("VITE_API_URL", "http://api.test");

    expect(
      productImageUrl({
        id: "dish-1",
        imageUrl: "/products/dish-1/image?v=123"
      })
    ).toBe("http://api.test/products/dish-1/image?v=123");
  });

  it("keeps an external http(s) link as it is", () => {
    expect(
      productImageUrl({ id: "dish-2", imageUrl: "https://example.com/a.jpg" })
    ).toBe("https://example.com/a.jpg");
  });

  it("returns null when the dish has no photo", () => {
    expect(productImageUrl({ id: "dish-3", imageUrl: null })).toBeNull();
  });
});
