import { BrandLogo } from "./BrandLogo";
import { NavLink, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";
import { useCart } from "../cart/useCart";
import { appConfig } from "../lib/config";
import type { Role } from "../types/auth";
import { ApiStatus } from "./ApiStatus";
import { EnvBadge } from "./EnvBadge";

type NavItem = { to: string; label: string };

/** Account links, by role. The cart is in the top bar, open to guests too. */
function accountNavItems(role: Role | null): NavItem[] {
  const items: NavItem[] = [];

  if (role) {
    items.push({ to: "/orders", label: "My orders" });
  }
  if (role === "ADMIN") {
    items.push(
      { to: "/admin/orders", label: "Orders (admin)" },
      { to: "/admin/menu", label: "Menu (admin)" }
    );
  }
  return items;
}

const buttonBase =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
const buttonOutline = `${buttonBase} text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100`;
const buttonPrimary = `${buttonBase} bg-brand-600 text-white hover:bg-brand-700`;

export function Layout() {
  const { environment, version } = appConfig();
  const { role, signOut } = useAuth();
  const { itemCount } = useCart();
  const secondaryLinks = accountNavItems(role);

  return (
    <div className="min-h-svh bg-[#fbf7ec] text-stone-900">
      <header className="sticky top-0 z-20 border-b border-brand-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-stone-900 hover:text-brand-700"
            >
              <BrandLogo className="h-9 w-9 text-brand-600" />
              QuickDish
            </NavLink>
            <div className="hidden sm:block">
              <EnvBadge
                environment={environment}
                version={version}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <ApiStatus />
            </div>
            <NavLink
              to="/cart"
              className={buttonOutline}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 7h12l-1 12H7L6 7Z" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" />
              </svg>
              <span className="sr-only">Cart</span>
              {itemCount > 0 && (
                <span
                  aria-label={`${itemCount} items in cart`}
                  className="rounded-full bg-brand-600 px-1.5 text-xs leading-5 text-white"
                >
                  {itemCount}
                </span>
              )}
            </NavLink>
            {role ?
              <button
                type="button"
                onClick={signOut}
                className={buttonOutline}
              >
                Sign out
              </button>
            : <>
                <NavLink
                  to="/login"
                  className={`${buttonOutline} hidden sm:inline-flex`}
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/register"
                  className={buttonPrimary}
                >
                  Sign up
                </NavLink>
              </>
            }
          </div>
        </div>

        {secondaryLinks.length > 0 && (
          <nav
            aria-label="Account"
            className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 border-t border-stone-100 px-4 py-2 text-sm"
          >
            {secondaryLinks.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ?
                    "font-semibold text-brand-700"
                  : "text-stone-600 hover:text-stone-900"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
