import type { Role } from "../types/auth";
import { apiRequest } from "./client";

/** Response of login and register, confirmed by the API team (#4). */
export type AuthResponse = {
  token: string;
  user: { id: string; name: string; email: string; role: Role };
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

// Contract confirmed by Ale (#4), no /api prefix:
//   POST /auth/login    { email, password } → { token, user }
//   POST /auth/register { name, email, password } → { token, user }
// The JWT carries `sub`, `role` ("CUSTOMER" | "ADMIN") and `exp` (8 h).
// Errors use { error: { code, message } }, handled in api/client.ts.

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export function register(input: RegisterInput) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input
  });
}
