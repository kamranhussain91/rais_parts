# Rais Honda POS & Workshop Management System

A full-featured Honda-branded Point-of-Sale and Workshop Management platform for a motorcycle parts dealership. Built with React + Vite frontend and Express 5 backend using a file-based JSON database.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/honda-pos run dev` — run the frontend (Vite, port 23813, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

**Login credentials (seed data):**
- `admin` / `admin` — Super Admin (full access)
- `manager` / `manager` — Manager
- `cashier1` / `cashier` — Cashier
- `storekeeper` / `keeper` — Store Keeper

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + Lucide icons + Recharts
- Backend: Express 5 + file-based JSON database (`data/db.json`)
- No PostgreSQL/Drizzle — intentional; file-based DB matches original app architecture

## Where things live

- `artifacts/honda-pos/` — React + Vite frontend (all 14 modules/views)
- `artifacts/honda-pos/src/types.ts` — all TypeScript types (source of truth)
- `artifacts/honda-pos/src/components/AppContext.tsx` — global state, all API calls
- `artifacts/api-server/src/routes/honda-pos.ts` — all backend API routes (file-based DB)
- `artifacts/api-server/src/honda-types.ts` — types copy for backend use
- `artifacts/api-server/data/db.json` — live database file (created on first request)
- `artifacts/api-server/data/backups/` — backup snapshots

## Architecture decisions

- **File-based JSON DB**: Chose to keep the original app's file-based approach rather than migrating to PostgreSQL/Drizzle. Avoids DATABASE_URL requirement and preserves the original data schema exactly.
- **API routes at /api**: Frontend makes all fetch calls to `/api/...` which routes through the reverse proxy to the api-server on port 8080.
- **No generated API hooks**: This app uses direct `fetch()` calls from AppContext.tsx, not the `@workspace/api-client-react` generated hooks. The `@workspace/api-client-react` dependency should be removed from honda-pos.
- **Types duplication**: `types.ts` is copied to `api-server/src/honda-types.ts` since creating a shared lib would add complexity; types are stable.
- **Honda branding**: White + Honda Red (#D32F2F) theme, Inter font, enterprise SaaS sidebar layout.

## Product

14 fully functional modules:
1. **Dashboard** — real-time KPIs, today's sales, inventory alerts, activity log
2. **POS** — multi-terminal point-of-sale with FBR invoice generation & QR codes
3. **Workshop** — service tickets with oil change reminders
4. **Oil Reminders** — WhatsApp reminder management for service due dates
5. **Inventory** — parts catalogue with stock levels and low-stock alerts
6. **Purchases** — supplier purchase orders with weighted average cost
7. **Expenses** — operating expense tracking with ledger integration
8. **Banking** — multi-account ledger with credit/debit transactions
9. **Customers** — CRM with purchase history
10. **Reports** — financial analytics with Recharts visualizations
11. **Backup/Restore** — JSON backup and restore
12. **Invoice Verification** — FBR compliance QR scan verifier (public URL)
13. **Users** — user account management with roles
14. **FBR Integration** — background queue processor for tax authority sync

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT run `pnpm dev` at workspace root — run each artifact's workflow separately.
- The data directory (`data/`) is created automatically relative to the api-server's working directory.
- `@workspace/api-client-react` is listed in honda-pos devDependencies but is NOT used — can be removed safely.
- The FBR background worker runs a `setInterval` inside the api-server process — this is intentional.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
