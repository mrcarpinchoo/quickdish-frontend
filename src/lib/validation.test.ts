import { describe, expect, it } from "vitest";
import { isValidEmail, passwordError } from "./validation";

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("ana@example.com")).toBe(true);
  });

  it("rejects text without an @ and a domain", () => {
    expect(isValidEmail("ana")).toBe(false);
    expect(isValidEmail("ana@example")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("passwordError", () => {
  it("requires at least 8 characters", () => {
    expect(passwordError("1234567")).not.toBeNull();
    expect(passwordError("12345678")).toBeNull();
  });
});
