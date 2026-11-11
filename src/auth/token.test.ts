import { describe, expect, it } from "vitest";
import { makeToken } from "../test/tokens";
import { roleFromToken } from "./token";

describe("roleFromToken", () => {
  it("reads the role from the payload", () => {
    expect(roleFromToken(makeToken({ role: "ADMIN" }))).toBe("ADMIN");
  });

  it("returns null once the token has expired", () => {
    const exp = Math.floor(Date.now() / 1000) - 60;

    expect(roleFromToken(makeToken({ role: "CUSTOMER", exp }))).toBeNull();
  });

  it("returns null for a role the app does not know", () => {
    expect(roleFromToken(makeToken({ role: "GUEST" }))).toBeNull();
  });

  it("returns null for a malformed token", () => {
    expect(roleFromToken("not-a-jwt")).toBeNull();
  });
});
