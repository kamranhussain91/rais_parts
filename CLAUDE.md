# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Rais Honda POS & Workshop** — a point-of-sale, inventory, workshop, and accounting app for a Honda motorcycle parts dealer in Lahore, Pakistan. Built as Replit **Artifacts** inside a larger **PNPM workspace**. This repo contains only the artifacts, not the workspace root (see "Missing workspace root" below).

Three packages under `artifacts/`:

| Package | Name | Role |
|---|---|---|
| `artifacts/honda-pos` | `@workspace/honda-pos` | React 19 + Vite SPA — the entire POS UI |
| `artifacts/api-server` | `@workspace/api-server` | Express 5 backend serving `/api/*` |
| `artifacts/mockup-sandbox` | `@workspace/mockup-sandbox` | Standalone Vite tool for previewing UI mockups; **not part of the shipped app** |

The frontend runs on port `23813` (base path `/`), the API on port `8080` (mounted at `/api`). A reverse proxy routes `/api/*` to the backend, so all frontend `fetch` calls use relative `/api/...` URLs.

## Commands

Per-package (run from the package directory or with `pnpm --filter`):

```bash
# Frontend (artifacts/honda-pos) — requires PORT and BASE_PATH env vars
PORT=23813 BASE_PATH=/ pnpm --filter @workspace/honda-pos run dev
pnpm --filter @workspace/honda-pos run build      # -> dist/public
pnpm --filter @workspace/honda-pos run typecheck   # tsc --noEmit

# API server (artifacts/api-server) — requires PORT env var
PORT=8080 pnpm --filter @workspace/api-server run dev   # build (esbuild) then start
pnpm --filter @workspace/api-server run build      # node build.mjs -> dist/index.mjs
pnpm --filter @workspace/api-server run typecheck
```

There is **no test suite and no linter** configured. `typecheck` (tsc `--noEmit`) is the only static check.

The API server is bundled with **esbuild** (`build.mjs`), not tsc — output is a single ESM file `dist/index.mjs`. `pino` logging is handled via `esbuild-plugin-pino`; a long `external` list excludes native/optional modules from the bundle.

## Missing workspace root (important)

This repo is a **partial checkout** — the PNPM workspace root is not committed. The following are referenced but absent:

- Root `package.json` and `pnpm-workspace.yaml` (which define `catalog:` version aliases and the workspace)
- `tsconfig.base.json` (extended by every package's `tsconfig.json` via `../../tsconfig.base.json`)
- `@workspace/*` internal packages: `@workspace/db`, `@workspace/api-zod`, `@workspace/api-client-react` (and `lib/api-client-react`)

Consequences:
- `catalog:` and `workspace:*` version specifiers only resolve under pnpm **with the workspace root present**. A plain `npm install` / `npm run dev` in a package will fail.
- Actual source imports of `@workspace/*` are minimal: only `artifacts/api-server/src/routes/health.ts` imports `@workspace/api-zod` (`HealthCheckResponse`). The `@workspace/db` / `drizzle-orm` deps in `api-server/package.json` and `@workspace/api-client-react` in `honda-pos/package.json` are **declared but unused by source** (see architecture notes).

## Architecture & non-obvious decisions

These come from `.agents/memory/honda-pos-arch.md` — read it before making structural changes.

- **File-based JSON database, NOT Postgres/Drizzle.** The API persists everything to `artifacts/api-server/data/db.json` via `readDB()` / `writeDB()` in `routes/honda-pos.ts`. This is intentional (avoids `DATABASE_URL` provisioning, preserves the original data model). **Do not** add Drizzle ORM or `@workspace/db` imports to honda-pos routes. `readDB()` also self-heals missing top-level keys and re-seeds `DEFAULT_DATABASE` on first run / corruption.
- **Types are duplicated on purpose.** `artifacts/honda-pos/src/types.ts` is the source of truth; `artifacts/api-server/src/honda-types.ts` is a hand-kept copy for the backend. **If you change one, change both.** A shared lib was deemed too much overhead.
- **No generated API hooks.** The frontend uses direct `fetch()` calls, all defined in `artifacts/honda-pos/src/components/AppContext.tsx`. It does **not** use React Query or the `@workspace/api-client-react` hooks despite the dependency. Add new backend calls as async methods on `AppContext`, exposed through `AppContextType`.
- **FBR background worker.** A `setInterval` in `routes/honda-pos.ts` processes the `fbrSyncQueue` every 10 seconds — it simulates a Pakistani FBR (tax authority) invoice-sync service. Related endpoints: `/api/fbr/*`. Invoices carry `fbr_hash`, `fbr_verified_status`, and a QR code (generated with `qrcode`) linking to public verification.

## Frontend structure

- **No router library for app navigation.** `App.tsx` is a single-page shell: a `currentTab` string in `AppContext` selects which `*View` component renders in `ContentViewport`. The sidebar menu and per-tab titles live in `App.tsx`.
- **Public invoice verification** is the one URL-driven path: `App.tsx` checks `?invoice=` / `?verify=` query params and renders `PublicInvoiceVerification` (bypassing login) instead of the app shell.
- **Auth is client-side and trivial.** Login matches username/password against `db.users` (plaintext passwords in seed data); the current user id is stored in `localStorage` (`rais_honda_current_user_id`). Role gating (`Super Admin`/`Admin`/`Manager` vs `Cashier`) is done in the UI only — the API does not enforce authz.
- One `*View.tsx` component per tab under `src/components/` (Dashboard, POS, Inventory, Purchase, Workshop, OilReminders, Expenses, Banking, Customers, Reporting, BackupRestore, Users, SalesHistory, InvoiceVerification). shadcn/ui primitives live under `src/components/ui/`. Path alias `@/*` -> `src/*`; `@assets` -> repo-root `attached_assets/`.

## Backend structure

- `index.ts` (reads `PORT`, listens) -> `app.ts` (pino-http logging, CORS, JSON body parsing, mounts `router` at `/api`) -> `routes/index.ts` (combines `health.ts` + `honda-pos.ts`).
- `routes/honda-pos.ts` (~1000 lines) holds nearly all endpoints and all business logic: sales, purchases, services, expenses, banking ledger, customers, users, backups, analytics cache, FBR queue, terminal sync. It owns the seed data (`DEFAULT_DATABASE`) and the DB read/write helpers.
- Money/stock mutations (sales, purchases, ledger) are computed server-side and written atomically into `db.json`. When adding endpoints, keep bank-account balance and product stock updates consistent with the ledger.

## Deployment

Replit-based (`.replit`, `artifacts/*/.replit-artifact/artifact.toml`). Production: honda-pos builds to static files served from `dist/public`; api-server runs `node dist/index.mjs` on port 8080 with health check at `/api/healthz`. `deploymentTarget = "autoscale"`.
