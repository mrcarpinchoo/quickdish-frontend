import { createContext } from "react";
import type { Role } from "../types/auth";

export type AuthState = {
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
