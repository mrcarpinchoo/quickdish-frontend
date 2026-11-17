# QuickDish Front-end

Frontend for **QuickDish**, a restaurant ordering platform. Customers browse the menu by category, add dishes to a cart and place orders without a waiter. Admins manage the menu and move each order through its lifecycle: pending → in preparation → ready → delivered.

The frontend is a single-page app built with [React](https://react.dev/) and [Vite](https://vite.dev/), hosted on [Cloudflare Pages](https://developers.cloudflare.com/pages/). It talks to the QuickDish API over REST.

## Related repositories

| Repository           | Description                                 |
| -------------------- | ------------------------------------------- |
| `quickdish-api`      | REST API on Cloudflare Workers              |
| `quickdish-frontend` | This repository: React frontend on Pages    |
| `quickdish-infra`    | Terraform code for the Cloudflare resources |

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

### Pipeline

`.github/workflows/pipeline.yml` runs on every pull request and every push to `main`:

- **Test:** type-checks, lints, checks formatting and runs the unit tests with coverage. The run summary shows the test results, and the `test-report` (JUnit) and `coverage-report` artifacts are attached to the run.
- **Build:** builds the app and attaches `dist/` as the `frontend-build` artifact.

Both jobs must pass before a pull request can be merged. The jobs run directly on the GitHub runner, with pnpm and Node.js versions taken from `package.json` and `.nvmrc`.

On a push to `main` (a merged pull request), two more jobs deploy the site to Cloudflare Pages:

- **Deploy to Development:** builds with `.env.dev` (the Dev API), uploads to `quickdish-frontend-dev` and checks that https://quickdish-frontend-dev.pages.dev serves the new build.
- **Deploy to Production:** waits until a reviewer approves the `Production` environment, then does the same with `.env.prod` and `quickdish-frontend-prod`.

Vite bakes the `VITE_*` values into the files, so each environment gets its own build. To reproduce one locally, run `pnpm build --mode dev` or `pnpm build --mode prod`. The badge in the header shows the environment and the commit.

### Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(cart): disable adding unavailable products

- Show an "Unavailable" badge on the product card
- Add component tests for the disabled button
```
