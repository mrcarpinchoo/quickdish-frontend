# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project context

QuickDish is a restaurant ordering platform built as the final project for the ITESO course "Infraestructura para el Desarrollo Continuo" (DevOps) by a team of three students. Customers browse a menu by category, add dishes to a cart, and place orders without a waiter. Admins manage the menu (categories, products, availability) from a panel and move each order through its lifecycle. There are two roles, customer and admin, and both require authentication. **Real payments are out of scope.**

The course grades the DevOps side (CI/CD, environments, IaC, containers, testing) as much as the app itself. Tooling must be pipeline-friendly: scripts that run non-interactively, plus tests, coverage and lint reports.

This repo is **only the frontend SPA**. The project is split across three repos, all under the GitHub user `mrcarpinchoo`:

| Repo              | Contents                                 | Hosting                 |
| ----------------- | ---------------------------------------- | ----------------------- |
| `quickdish-api`   | Hono REST API                            | Cloudflare Workers + D1 |
| `quickdish-web`   | React + TypeScript + Vite + Tailwind SPA | Cloudflare Pages        |
| `quickdish-infra` | Terraform for the Cloudflare resources   | —                       |

The API docs call this repo `quickdish-web`, but the local folder and `package.json` name are `quickdish-frontend`. Confirm the final name with the user before creating the GitHub remote or naming the Cloudflare project.

The repos are checked out side by side. The sibling `quickdish-api/` folder has its own `AGENTS.md`, which is the source of truth for the backend. The parent folder also holds `architecture-diagram.mmd`, `ci-cd-diagram.mmd` and the original `Project proposal.pdf` (in Spanish).

Project board: https://github.com/users/mrcarpinchoo/projects/2

## Current state

The repo is still the unmodified `create-vite` `react-ts` template: React 19, Vite 8, TypeScript 6 and ESLint 10. `src/App.tsx` is the template's demo page and `README.md` is the template's README. None of the following exists yet: Tailwind, Prettier, Vitest, most of the target scripts, `VITE_API_URL`, the API client, routing, deployment or CI.

## Commands

The package manager is **pnpm** (12.15.0 locally) on Node.js 24 LTS.

```bash
pnpm install
pnpm dev        # Vite dev server (http://localhost:5173)
pnpm build      # tsc -b && vite build, outputs dist/
pnpm preview    # serve the built dist/ locally
pnpm lint       # eslint .
```

These scripts are still missing: `typecheck`, `lint:fix`, `format`, `format:check`, `test` (run once), `test:watch` and `test:ci` (coverage plus a JUnit report at `reports/junit.xml`). Give them the same names and definitions as in `quickdish-api/package.json` so CI looks the same in both repos. Once Vitest is in place, run a single file with `pnpm test path/to/file.test.ts` or tests matching a name with `pnpm test -t "name"`.

Before considering a change done, run `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test`, or whichever of them exist so far.

- Type-check with `tsc -b`, not `tsc`. The root `tsconfig.json` has `"files": []` and only references the two sub-projects, so a plain `tsc` checks nothing and exits 0. The `typecheck` script should be `tsc -b`.
- If you add a `deploy` script, run it as `pnpm run deploy`. A bare `pnpm deploy` is a different built-in pnpm command.
- The API pins `"packageManager": "pnpm@12.15.0"` in `package.json`. This repo doesn't yet; add the same field so CI uses the same pnpm.

## Tech stack

| Concern      | Choice                     |
| ------------ | -------------------------- |
| Framework    | React + TypeScript         |
| Build tool   | Vite                       |
| Styling      | Tailwind CSS (not set up)  |
| Testing      | Vitest (not set up)        |
| Code quality | ESLint + Prettier          |
| Hosting      | Cloudflare Pages (planned) |

The proposal doesn't fix routing, data fetching or form libraries. Propose a choice and ask the user instead of picking silently.

## Architecture

```
Browser ──HTTPS──▶ Cloudflare Pages (React SPA) ──HTTPS / REST (JSON)──▶ Cloudflare Worker (Hono API) ──Prisma──▶ D1 (SQLite)
```

The frontend and the API are **separate deployments**. Don't serve the SPA from the API Worker, and don't move API logic into the frontend.

Planned CI/CD (GitHub Actions): push → unit tests → build → deploy to Dev → manual approval → deploy to Prod. The CI diagram also pushes a container image to Docker Hub. That is planned for the API. Whether the frontend gets an image too is not decided yet.

Cloudflare docs change often, so read the current docs before setting up deployment. Cloudflare has been steering new static/SPA projects toward Workers with static assets rather than Pages. If that's still the case, raise it with the user as an option. The proposal says Pages, so don't switch on your own.

### Code and config

- Entry chain: `index.html` → `src/main.tsx`, which mounts `<App>` inside `StrictMode` → `src/App.tsx`. Files in `public/` are served from the site root unchanged. Assets in `src/assets/` are imported, so Vite fingerprints them.
- The TypeScript setup uses project references. `tsconfig.app.json` covers `src/` (DOM libs, `vite/client` types) and `tsconfig.node.json` covers only `vite.config.ts` (Node types). Add any new root-level TS config, such as `vitest.config.ts`, to `tsconfig.node.json`'s `include`, or it won't be type-checked.
- `erasableSyntaxOnly` is on, so TS `enum`s, `namespace`s and constructor parameter properties are compile errors. Model `Role`, `OrderStatus` and similar types as string-literal unions or `as const` objects.
- `verbatimModuleSyntax` is on, so type-only imports must use `import type`.
- Env vars: only `VITE_`-prefixed variables reach client code (via `import.meta.env`), and Vite inlines them at build time. The API URL is therefore baked into each build, so Dev and Prod need separate builds with their own `VITE_API_URL`. Type the variables by declaring `ImportMetaEnv` in `src/vite-env.d.ts`. `.gitignore` already ignores `*.local`, which keeps `.env.local` out of git. Anything in a `VITE_` variable ships to the browser, so never put secrets there.
- ESLint runs the template config: non-type-aware `tseslint.configs.recommended`, plus `react-hooks` and `react-refresh`. The `react-refresh` rule warns when a file exports both components and non-components, because that breaks Fast Refresh. The API's config is stricter (`recommendedTypeChecked` with `projectService`, plus `eslint-config-prettier`). Align this repo with it when you add Prettier.

## API integration

The API is freshly scaffolded and evolves in parallel. Check `quickdish-api` for its current state. As of 2026-11-10:

- **The only endpoint is `GET /health` → `{"status":"ok"}`.** No other routes exist, and the Prisma schema has no models.
- Local dev URL: `http://localhost:8787` (`pnpm dev` in `quickdish-api`). Deployed URLs don't exist yet. There will be separate Dev and Prod Workers, each with its own D1 database.
- **CORS is not configured.** The SPA and the API are on different origins, so the API will need `hono/cors` allowing the Pages origins and the local Vite origin. A Vite dev `server.proxy` avoids CORS locally but not in deployed environments.
- Auth will use JWT (`hono/jwt`). How the token travels is not decided. A bearer token in the `Authorization` header is the simplest choice across domains. Cookies across `*.pages.dev` and `*.workers.dev` are cross-site and need `SameSite=None; Secure` plus credentialed CORS. Settle this with the user before building auth.
- Not decided yet: route names, response and error shapes, pagination, and how prices are represented (decimal or integer cents).

Until the API contract exists:

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

- **All code is in English**: identifiers, routes, file names, enum values. The language of the UI copy (Spanish, English, or i18n) is not decided yet, so ask.
- **Prettier**: copy `quickdish-api/.prettierrc`. It uses double quotes, semicolons, no trailing commas, `arrowParens: "avoid"`, `printWidth: 80`, `singleAttributePerLine: true` and `experimentalTernaries: true`, with 2-space indentation for JS/TS/JSON/YAML. The template code uses single quotes and trailing commas, so when you add Prettier, reformat the whole repo in a separate `style:` commit, as the API did.
- When you add `test:ci`, add `coverage/` and `reports/` to `.gitignore`, `.prettierignore` and the ESLint ignores.

## Git conventions

The branch strategy is **GitHub Flow**:

- `main` is the only long-lived branch and must always be deployable.
- Work happens on short-lived branches created from `main`, named `<type>/<short-description>`, where `<type>` is a Conventional Commits type (e.g. `feat/menu-page`).
- Changes reach `main` through a pull request approved by a teammate.

Commits:

- Use [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): subject`). When a commit needs a body, write it as bullet points.
- Never add a `Co-Authored-By` trailer or any other AI attribution to commits or PRs.
- Commit or push only when the user asks.
