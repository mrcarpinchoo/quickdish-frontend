import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { setAuthToken, setUnauthorizedHandler } from "../api/client";
import { AuthContext, type AuthState } from "./AuthContext";
import {
  clearStoredToken,
  readStoredToken,
  roleFromToken,
  storeToken
} from "./token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = readStoredToken();
    return stored && roleFromToken(stored) ? stored : null;
  });

  const role = useMemo(() => (token ? roleFromToken(token) : null), [token]);

  const signIn = useCallback((next: string) => {
    storeToken(next);
    setToken(next);
  }, []);

  const signOut = useCallback(() => {
    clearStoredToken();
    setToken(null);
  }, []);

  useEffect(() => {
    setAuthToken(role ? token : null);
  }, [token, role]);

  // Any 401 from the API ends the session.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      role,
      isAuthenticated: role !== null,
      signIn,
      signOut
    }),
    [token, role, signIn, signOut]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
