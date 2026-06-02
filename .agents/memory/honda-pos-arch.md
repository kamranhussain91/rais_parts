---
name: Honda POS Architecture
description: Key non-obvious decisions for the Rais Honda POS & Workshop app
---

## File-based JSON database

The Honda POS app uses a file-based JSON database (`data/db.json`) instead of PostgreSQL/Drizzle. This was intentional — the original app was file-based and migrating to PostgreSQL would require schema design and DATABASE_URL provisioning.

**Why:** Avoids DATABASE_URL requirement. Preserves original data model exactly. The app's data volume (hundreds of records) doesn't require a relational DB.

**How to apply:** Never add Drizzle ORM or @workspace/db imports to honda-pos routes. If you need to query data, use `readDB()` from `artifacts/api-server/src/routes/honda-pos.ts`.

## Types duplication

`artifacts/honda-pos/src/types.ts` is the source of truth for all types. A copy lives at `artifacts/api-server/src/honda-types.ts` for backend use. Creating a shared lib was too much overhead for a stable type surface.

**Why:** Avoids the complexity of a new shared lib. Types are stable.

**How to apply:** If types change, update both files.

## No generated API hooks

The frontend uses direct `fetch()` calls from `AppContext.tsx`, not the `@workspace/api-client-react` generated React Query hooks. The `@workspace/api-client-react` devDependency in honda-pos is unused and can be removed.

**Why:** The original app used direct fetch; preserving this avoids a full refactor and keeps the AppContext state management simple.

## Route structure

Frontend at `/` (port 23813), API server at `/api` (port 8080). All API calls in AppContext.tsx already use `/api/...` prefix. The reverse proxy routes them correctly.

## FBR background worker

A `setInterval` inside `honda-pos.ts` runs every 10 seconds to process the FBR queue. This is intentional — it simulates a background tax sync service.
