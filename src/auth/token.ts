import type { Role } from "../types/auth";

const STORAGE_KEY = "quickdish.token";

export function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode, disabled site data).
    return null;
  }
}

export function storeToken(token: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Without storage the session lasts until the page reloads.
  }
}

export function clearStoredToken() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

function isRole(value: unknown): value is Role {
  return value === "CUSTOMER" || value === "ADMIN";
}

function decodePayload(token: string): Record<string, unknown> | null {
  const segment = token.split(".")[1];
  if (!segment) return null;

  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const parsed: unknown = JSON.parse(atob(padded));
    return typeof parsed === "object" && parsed !== null ?
        (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Reads the role from a JWT payload, or null when the token is malformed or
 * expired. It does not check the signature: the API does that on each request.
 */
export function roleFromToken(token: string, now = Date.now()): Role | null {
  const payload = decodePayload(token);
  if (!payload) return null;

  const { exp, role } = payload;
  if (typeof exp === "number" && exp * 1000 <= now) return null;
  return isRole(role) ? role : null;
}
