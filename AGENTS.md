# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project context

QuickDish is a restaurant ordering platform built as the final project for the ITESO course "Infraestructura para el Desarrollo Continuo" (DevOps) by a team of three students. Customers browse a menu by category, add dishes to a cart, and place orders without a waiter. Admins manage the menu (categories, products, availability) from a panel and move each order through its lifecycle. There are two roles, customer and admin, and both require authentication. **Real payments are out of scope.**

The course grades the DevOps side (CI/CD, environments, IaC, containers, testing) as much as the app itself. Tooling must be pipeline-friendly: scripts that run non-interactively, plus tests, coverage and lint reports.

This repo is **only the frontend SPA**. The project is split across three repos, all under the GitHub user `mrcarpinchoo`:

| Repo                 | Contents                                 | Hosting                 |
| -------------------- | ---------------------------------------- | ----------------------- |
| `quickdish-api`      | Hono REST API                            | Cloudflare Workers + D1 |
| `quickdish-frontend` | React + TypeScript + Vite + Tailwind SPA | Cloudflare Pages        |
| `quickdish-infra`    | Terraform for the Cloudflare resources   | —                       |

The repos are checked out side by side. The sibling `quickdish-api/` folder has its own `AGENTS.md`, which is the source of truth for the backend. The parent folder also holds `architecture-diagram.mmd`, `ci-cd-diagram.mmd` and the original `Project proposal.pdf` (in Spanish).

Project board: https://github.com/users/mrcarpinchoo/projects/2

## Current state

The tooling is in place (Tailwind, Prettier, type-aware ESLint, Vitest). The app has its shell: React Router routes, a layout with the environment badge and the API status, the typed API client in `src/api/client.ts`, and the menu screen with mock data (`src/mocks/menu.ts`). Login and register forms exist and the session lives in `AuthProvider` (`src/auth/`), with `RequireAuth` and `RequireRole` guarding routes. Cart, orders and the admin screens are still placeholders (`PlaceholderPage`). The auth contract is confirmed by the API team (documented in `src/api/auth.ts`), but the endpoints are not in the API yet, so the front keeps using the local mocks where needed. Deployment and CI are not set up yet.

## Commands

The package manager is **pnpm**, pinned through `packageManager` in `package.json` (`pnpm@12.15.0`, the same as the API), on Node.js 24 LTS (pinned in `.nvmrc`; run `nvm use` or `fnm use`).

```bash
pnpm install
pnpm dev            # Vite dev server (http://localhost:5173)
pnpm build          # tsc -b && vite build, outputs dist/
pnpm preview        # serve the built dist/ locally
pnpm typecheck      # tsc -b
pnpm lint           # ESLint with type-aware typescript-eslint rules; lint:fix to auto-fix
pnpm format         # Prettier write; format:check to only check
pnpm test           # Vitest, run once; test:watch for watch mode
pnpm test:ci        # Vitest with V8 coverage (coverage/) and JUnit report (reports/junit.xml)

pnpm test src/pages/MenuPage.test.tsx    # run a single test file
pnpm test -t "filters"                   # run tests whose name matches
```

The script names and definitions match `quickdish-api/package.json`, so CI looks the same in both repos. Keep them in sync.

Before considering a change done, run `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test`.

- Type-check with `tsc -b` (`pnpm typecheck`), never a plain `tsc`. The root `tsconfig.json` has `"files": []` and only references the two sub-projects, so a plain `tsc` checks nothing and exits 0.
- If you add a `deploy` script, run it as `pnpm run deploy`. A bare `pnpm deploy` is a different built-in pnpm command.

## Tech stack

| Concern      | Choice                                |
| ------------ | ------------------------------------- |
| Framework    | React 19 + TypeScript 6               |
| Build tool   | Vite 8                                |
| Styling      | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing      | React Router (`react-router`)         |
| Testing      | Vitest + jsdom + Testing Library      |
| Code quality | ESLint (type-aware) + Prettier        |
| Hosting      | Cloudflare Pages (planned)            |

Routing is React Router, chosen on 2026-11-11 for the app shell. Data fetching and form libraries are still open: propose a choice and ask the user instead of picking silently.

## Architecture

```
Browser ──HTTPS──▶ Cloudflare Pages (React SPA) ──HTTPS / REST (JSON)──▶ Cloudflare Worker (Hono API) ──Prisma──▶ D1 (SQLite)
```

The frontend and the API are **separate deployments**. Don't serve the SPA from the API Worker, and don't move API logic into the frontend.

Planned CI/CD (GitHub Actions): push → unit tests → build → deploy to Dev → manual approval → deploy to Prod. The CI diagram also pushes a container image to Docker Hub. That is planned for the API. Whether the frontend gets an image too is not decided yet.

Cloudflare docs change often, so read the current docs before setting up deployment. Cloudflare has been steering new static/SPA projects toward Workers with static assets rather than Pages. If that's still the case, raise it with the user as an option. The proposal says Pages, so don't switch on your own.

### Code and config

- Entry chain: `index.html` → `src/main.tsx`, which mounts `<App>` inside `StrictMode` and `BrowserRouter` → `src/App.tsx`, which defines the routes. Files in `public/` are served from the site root unchanged. Assets in `src/assets/` (none yet) would be imported, so Vite fingerprints them.
- The TypeScript setup uses project references. `tsconfig.app.json` covers `src/` (DOM libs, `vite/client` types), including test files. `tsconfig.node.json` covers the root config files `vite.config.ts` and `vitest.config.ts` (Node types). Add any new root-level TS config to `tsconfig.node.json`'s `include`, or it won't be type-checked.
- `erasableSyntaxOnly` is on, so TS `enum`s, `namespace`s and constructor parameter properties are compile errors. Model `Role`, `OrderStatus` and similar types as string-literal unions or `as const` objects.
- `verbatimModuleSyntax` is on, so type-only imports must use `import type`.
- Env vars: only `VITE_`-prefixed variables reach client code (via `import.meta.env`), and Vite inlines them at build time. The API URL is therefore baked into each build, so Dev and Prod need separate builds with their own `VITE_API_URL`. Type the variables by declaring `ImportMetaEnv` in `src/vite-env.d.ts`. `.gitignore` already ignores `*.local`, which keeps `.env.local` out of git. Anything in a `VITE_` variable ships to the browser, so never put secrets there.
- Tailwind v4 has no `tailwind.config.js`. It's loaded by `@import "tailwindcss"` at the top of `src/index.css`, and theme customization goes in that file with `@theme`. `prettier-plugin-tailwindcss` sorts class names and reads the theme from `src/index.css` (the `tailwindStylesheet` option in `.prettierrc`), so update that option if the main stylesheet moves.
- `public/_redirects` (`/*  /index.html  200`) makes deep links such as `/cart` work on Pages. Keep it when the SPA is deployed.
- ESLint follows the API's layout: `recommendedTypeChecked` with `projectService`, and `eslint-config-prettier` last. The React Hooks and React Refresh rules apply only to `src/`. Root config files get Node globals, and plain `.js` files skip type-aware rules. The `react-refresh` rule warns when a file exports both components and non-components, because that breaks Fast Refresh.

### Testing

- Tests sit next to the code they cover as `src/**/*.test.{ts,tsx}` and run in jsdom. The API keeps its tests in `test/` instead, because it has no components to colocate with.
- `vitest.config.ts` merges `vite.config.ts`, so tests run with the same plugins as the app. Put test-only options there, not in `vite.config.ts`.
- Vitest globals are off: import `describe`, `it`, `expect` and `vi` from `"vitest"`. Because globals are off, Testing Library can't unmount components automatically, so `src/test/setup.ts` calls `cleanup()` after each test. It also registers the jest-dom matchers (`toBeInTheDocument()` and the like).

## API integration

The API is freshly scaffolded and evolves in parallel. Check `quickdish-api` for its current state. As of 2026-11-10:

- **The only endpoint is `GET /health` → `{"status":"ok"}`.** No other routes exist, and the Prisma schema has no models.
- Local dev URL: `http://localhost:8787` (`pnpm dev` in `quickdish-api`). Deployed URLs don't exist yet. There will be separate Dev and Prod Workers, each with its own D1 database.
- **CORS:** the API enables `hono/cors` for `http://localhost:5173` (#5). The Pages origins are added once #14 exists. Other local ports (such as 5180) are not allowed.
- **Auth:** JWT, sent as `Authorization: Bearer <token>`. Cookies are not used.
- **Confirmed contract (#4, by Ale):**
    - `POST /auth/login` and `POST /auth/register` return `{ token, user }`, where `user = { id, name, email, role }`.
    - The JWT carries `sub`, `role` (`CUSTOMER` or `ADMIN`) and `exp` (8 h). The frontend reads the role without checking the signature; the API checks it on every request.
    - Ids are strings (UUID). Prices are integers in cents (`priceCents`, `totalCents`, `unitPriceCents`).
    - Errors are always `{ "error": { "code": "...", "message": "..." } }`.
- Endpoints that are still missing: categories, products, cart and orders. Until they exist, the menu uses mocks.

Until the rest of the contract exists:

- Put every API call in one typed client module (e.g. `src/api/`), so endpoints can change in one place.
- Read the base URL from `VITE_API_URL`, with one value per environment (local, Dev, Prod). Never hard-code it.
- If you need endpoints that don't exist, write down the assumed contract (method, path, request and response shapes) and tell the user. Don't invent one silently. Mock data is fine for building screens.

## UI scope

**Public / customer**

- Register, log in, log out, view and edit own profile
- Browse the menu by category, and view a product (name, description, price, image, availability)
- Cart: add an item (with quantity and optional notes), change quantity, remove an item, empty the cart, see the running total
- Place an order from the cart (optional order notes)
- "My orders": list with current status, order detail, cancel while `PENDING`

**Admin**

- Categories: create, list, edit, delete, activate/deactivate
- Products: create, list (with filters), edit, delete, toggle availability
- Orders: list all, filter by status, view detail, advance status
- Users: list

## Domain model (starting point)

The team will refine this model. It mirrors `quickdish-api/AGENTS.md`, which is the source of truth.

| Entity                | Fields / notes                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `User`                | name, email, passwordHash (never sent to the client), role, createdAt                    |
| `Role`                | `CUSTOMER`, `ADMIN`                                                                      |
| `Category`            | name, description, active; groups products                                               |
| `Product`             | name, description, price, imageUrl, available, categoryId                                |
| `Cart` / `CartItem`   | a user has at most one cart; an item has productId, quantity, notes                      |
| `Order` / `OrderItem` | an order has status, total, notes, createdAt; an item has productId, quantity, unitPrice |
| `OrderStatus`         | `PENDING` → `IN_PREPARATION` → `READY` → `DELIVERED`, plus `CANCELLED`                   |

Business rules the UI should reflect. The API enforces them, so the UI shouldn't be the only check.

- An order can only be cancelled while it is `PENDING`. Hide or disable "Cancel" otherwise.
- Products with `available = false` can't be added to the cart. Show them as unavailable instead.
- `OrderItem.unitPrice` is the price at purchase time. Past orders show that price, not the current product price.
- Orders are created from the cart. Customers create and cancel their own orders, and only admins change order status.

## Conventions

- **All code is in English**: identifiers, routes, file names, enum values.
- **UI copy is in English**, changed on 2026-11-12 at the user's request (it was Spanish since 2026-11-11). No i18n for now. The API already returns English error messages, so the UI shows them as they come.
- **Prettier**: `.prettierrc` is the API's config plus the Tailwind plugin. It uses double quotes, semicolons, no trailing commas, `arrowParens: "avoid"`, `printWidth: 80`, `singleAttributePerLine: true` and `experimentalTernaries: true`, with 2-space indentation for JS/TS/JSON/YAML and 4 spaces for everything else (CSS, HTML, Markdown). Keep the shared options in sync with `quickdish-api/.prettierrc`.

## Git conventions

The branch strategy is **GitHub Flow**:

- `main` is the only long-lived branch and must always be deployable.
- Work happens on short-lived branches created from `main`, named `<type>/<short-description>`, where `<type>` is a Conventional Commits type (e.g. `feat/menu-page`).
- Changes reach `main` through a pull request approved by a teammate.

Commits:

- Use [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): subject`). When a commit needs a body, write it as bullet points.
- Never add a `Co-Authored-By` trailer or any other AI attribution to commits or PRs.
- Commit or push only when the user asks.
