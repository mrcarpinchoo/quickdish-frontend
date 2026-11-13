import { NavLink, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";
import { appConfig } from "../lib/config";
import type { Role } from "../types/auth";
import { ApiStatus } from "./ApiStatus";
import { EnvBadge } from "./EnvBadge";

type NavItem = { to: string; label: string };

/** Links depend on the role, so each user only sees pages they can open. */
function navItems(role: Role | null): NavItem[] {
  const items: NavItem[] = [{ to: "/", label: "Menu" }];

  if (role) {
    items.push(
      { to: "/cart", label: "Cart" },
      { to: "/orders", label: "My orders" }
    );
  }
  if (role === "ADMIN") {
    items.push(
      { to: "/admin/orders", label: "Orders (admin)" },
      { to: "/admin/menu", label: "Menu (admin)" }
    );
  }
  if (!role) {
    items.push(
      { to: "/login", label: "Sign in" },
      { to: "/register", label: "Sign up" }
    );
  }
  return items;
}

export function Layout() {
  const { environment, version } = appConfig();
  const { role, signOut } = useAuth();

  return (
    <div className="min-h-svh bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">QuickDish</span>
            <EnvBadge
              environment={environment}
              version={version}
            />
          </div>
          <div className="flex items-center gap-3">
            <ApiStatus />
            {role && (
              <button
                type="button"
                onClick={signOut}
                className="rounded-md px-3 py-1 text-sm text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-5xl flex-wrap gap-x-4 gap-y-2 px-4 pb-3 text-sm"
        >
          {navItems(role).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ?
                  "font-semibold text-orange-700"
                : "text-stone-600 hover:text-stone-900"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
