import { describe, expect, it } from "vitest";
import { formatCents } from "./money";

describe("formatCents", () => {
  it("converts cents to pesos with two decimals", () => {
    expect(formatCents(11000)).toMatch(/110\.00/);
    expect(formatCents(4500)).toMatch(/45\.00/);
  });

  it("keeps the cents", () => {
    expect(formatCents(9550)).toMatch(/95\.50/);
  });
});
