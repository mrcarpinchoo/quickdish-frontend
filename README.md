# QuickDish Web

Frontend for **QuickDish**, a restaurant ordering platform. Customers browse the menu by category, add dishes to a cart and place orders without a waiter. Admins manage the menu and move each order through its lifecycle: pending → in preparation → ready → delivered.

The frontend is a single-page app built with [React](https://react.dev/) and [Vite](https://vite.dev/), hosted on [Cloudflare Pages](https://developers.cloudflare.com/pages/). It talks to the QuickDish API over REST.

## Related repositories

| Repository        | Description                                 |
| ----------------- | ------------------------------------------- |
| `quickdish-api`   | REST API on Cloudflare Workers              |
| `quickdish-web`   | This repository: React frontend on Pages    |
| `quickdish-infra` | Terraform code for the Cloudflare resources |

## Tech stack

| Component    | Technology                       |
| ------------ | -------------------------------- |
| Framework    | React                            |
| Language     | TypeScript                       |
| Build tool   | Vite                             |
| Styling      | Tailwind CSS                     |
| Testing      | Vitest + jsdom + Testing Library |
| Code quality | ESLint + Prettier                |
| Hosting      | Cloudflare Pages                 |

The project is in its initial scaffolding stage: the tooling is set up, but the app is still the Vite starter page and deployment is not configured yet.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 LTS (the version is set in `.nvmrc`, so `nvm use` or `fnm use` picks it up)
- [pnpm](https://pnpm.io/) 12 (the exact version is pinned in `package.json`)

### Install and run

```bash
pnpm install
pnpm dev
```

The app is served at `http://localhost:5173`.

## Scripts

| Command          | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `pnpm dev`       | Start the Vite development server                                     |
| `pnpm build`     | Type-check and build the app into `dist/`                             |
| `pnpm preview`   | Serve the production build from `dist/` locally                       |
| `pnpm typecheck` | Type-check the project with `tsc -b`                                  |
| `pnpm lint`      | Lint with ESLint (`pnpm lint:fix` to auto-fix)                        |
| `pnpm format`    | Format all files with Prettier (`pnpm format:check` to only check)    |
| `pnpm test`      | Run the unit tests once (`pnpm test:watch` for watch mode)            |
| `pnpm test:ci`   | Run tests with coverage (`coverage/`) and a JUnit report (`reports/`) |

## Contributing

### Branch strategy

We use **GitHub Flow**:

1. Create a short-lived branch from `main` named `<type>/<short-description>`, for example `feat/menu-page` or `fix/cart-total`.
2. Open a pull request to `main` and get it approved by a teammate.
3. Merging to `main` runs the pipeline: tests → deploy to Dev → manual approval → deploy to Prod.

### Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(cart): disable adding unavailable products

- Show an "Unavailable" badge on the product card
- Add component tests for the disabled button
```
