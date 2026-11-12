import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import type { Role } from "../types/auth";
import { useAuth } from "./useAuth";

type GuardProps = {
  children: ReactNode;
};

/** Sends anonymous visitors to /login and remembers where they were going. */
export function RequireAuth({ children }: GuardProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  return children;
}

/** Like RequireAuth, but also sends users with another role to the menu. */
export function RequireRole({ role, children }: GuardProps & { role: Role }) {
  const { role: current } = useAuth();

  return (
    <RequireAuth>
      {current === role ?
        children
      : <Navigate
          to="/"
          replace
        />
      }
    </RequireAuth>
  );
}
