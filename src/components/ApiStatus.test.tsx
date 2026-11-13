import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiStatus } from "./ApiStatus";

describe("ApiStatus", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://api.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("shows online when /health answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }))
    );

    render(<ApiStatus />);

    expect(await screen.findByText("API online")).toBeInTheDocument();
  });

  it("shows offline when the API cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    render(<ApiStatus />);

    expect(await screen.findByText("API offline")).toBeInTheDocument();
  });
});
