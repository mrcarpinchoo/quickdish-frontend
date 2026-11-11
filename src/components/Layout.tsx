import { NavLink, Outlet } from "react-router";
import { appConfig } from "../lib/config";
import { ApiStatus } from "./ApiStatus";
import { EnvBadge } from "./EnvBadge";

// Login and admin links are visible to everyone until auth lands (#13, Jue 12).
const links = [
  { to: "/", label: "Menú" },
  { to: "/cart", label: "Carrito" },
  { to: "/orders", label: "Mis pedidos" },
  { to: "/admin/orders", label: "Pedidos (admin)" },
  { to: "/admin/menu", label: "Menú (admin)" },
  { to: "/login", label: "Iniciar sesión" },
  { to: "/register", label: "Registrarse" }
];

export function Layout() {
  const { environment, version } = appConfig();

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
          <ApiStatus />
        </div>
        <nav
          aria-label="Principal"
          className="mx-auto flex max-w-5xl flex-wrap gap-x-4 gap-y-2 px-4 pb-3 text-sm"
        >
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                isActive ?
                  "font-semibold text-orange-700"
                : "text-stone-600 hover:text-stone-900"
              }
            >
              {link.label}
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
