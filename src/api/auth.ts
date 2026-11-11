import { apiRequest } from "./client";

type AuthResponse = { token: string };

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

// Assumed contract until Ale's auth story (#8) exists:
//   POST /auth/login    { email, password } → { token }
//   POST /auth/register { name, email, password } → { token }
// The JWT payload must carry `role` ("CUSTOMER" | "ADMIN") and `exp`.

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
