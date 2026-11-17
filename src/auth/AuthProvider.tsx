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
  // The API client gets the token synchronously, not in an effect: child
  // effects (such as CartProvider's /cart request) run before this component's
  // effects, so an effect here would send the first requests without a token.
  const [token, setToken] = useState<string | null>(() => {
    const stored = readStoredToken();
    const valid = stored && roleFromToken(stored) ? stored : null;
    setAuthToken(valid);
    return valid;
  });

  const role = useMemo(() => (token ? roleFromToken(token) : null), [token]);

  const signIn = useCallback((next: string) => {
    storeToken(next);
    setAuthToken(roleFromToken(next) ? next : null);
    setToken(next);
  }, []);

  const signOut = useCallback(() => {
    clearStoredToken();
    setAuthToken(null);
    setToken(null);
  }, []);

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
