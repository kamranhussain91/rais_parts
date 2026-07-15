import type { AppDatabase, User } from "@/types";
import { sql } from "@/lib/pg";

// ─── Structural defaults (NO dummy business data) ────────────────────────────
// Only the three bank/cash accounts the ledger logic references by id are
// seeded, all at zero balance. Users start empty — the first signup becomes the
// Super Admin owner. Everything else is created through the app via real APIs.
export const DEFAULT_ACCOUNTS = [
  { id: "cash_chest", bankName: "Cash in Hand", accountNumber: "CASH", balance: 0 },
  { id: "bank_1", bankName: "Primary Bank Account", accountNumber: "—", balance: 0 },
  { id: "bank_2", bankName: "Card / POS Account", accountNumber: "—", balance: 0 },
];

// The single seeded Super Admin owner. Password: @Admin123 (scrypt hash below).
// This is the ONLY seeded account; all other data is created through the app.
export const SEED_SUPER_ADMIN: User = {
  id: "user_super_admin",
  username: "admin@store.com",
  email: "admin@store.com",
  name: "Super Admin",
  role: "Super Admin",
  passwordHash:
    "scrypt$44ed137109c325fbc1835e7c56843e40$1e463ab358b0f0c26124b4a9354afdc3f64f70a6c874bb200b4b27f5f99eb179ddd263a3a2f9ce34c0ef2e86fc9846d2a75e21a1f820104f688867fb72829ad0",
  status: "Active",
};

export function defaultDatabase(): AppDatabase {
  return {
    users: [JSON.parse(JSON.stringify(SEED_SUPER_ADMIN))],
    products: [],
    invoices: [],
    purchases: [],
    services: [],
    expenses: [],
    accounts: JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)),
    ledger: [],
    customers: [],
    suppliers: [],
    activityLogs: [],
    backups: [],
    fbrSyncQueue: [],
    terminalSyncLogs: [],
    analyticsCache: { lastUpdated: new Date(0).toISOString(), preAggregated: null },
  };
}

// AppDatabase collection keys persisted as one JSONB document per collection.
const DB_KEYS: (keyof AppDatabase)[] = [
  "users", "products", "invoices", "purchases", "services", "expenses",
  "accounts", "ledger", "customers", "suppliers", "activityLogs", "backups",
  "fbrSyncQueue", "terminalSyncLogs", "analyticsCache",
];

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql()`CREATE TABLE IF NOT EXISTS app_state (key text PRIMARY KEY, value jsonb NOT NULL)`;
    })().catch((err) => {
      schemaReady = null; // allow retry on next call
      throw err;
    });
  }
  return schemaReady;
}

/** Read the whole database (server-side, includes password hashes). */
export async function readDB(): Promise<AppDatabase> {
  await ensureSchema();
  const rows = (await sql()`SELECT key, value FROM app_state`) as { key: string; value: unknown }[];

  if (rows.length === 0) {
    const seeded = defaultDatabase();
    await writeDB(seeded);
    return seeded;
  }

  const map = new Map(rows.map((r) => [r.key, r.value]));
  const base = defaultDatabase();
  for (const key of DB_KEYS) {
    if (map.has(key)) (base as Record<string, unknown>)[key] = map.get(key);
  }
  return base;
}

/** Persist the whole database atomically (one HTTP transaction). */
export async function writeDB(db: AppDatabase): Promise<void> {
  await ensureSchema();
  const s = sql();
  const queries = DB_KEYS.map((key) =>
    s`INSERT INTO app_state (key, value) VALUES (${key}, ${JSON.stringify(db[key] ?? null)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
  );
  await s.transaction(queries);
}

// ─── Arbitrary singleton state (fbrConfig, partsLocks) ───────────────────────
export async function readState<T>(key: string, fallback: T): Promise<T> {
  await ensureSchema();
  const rows = (await sql()`SELECT value FROM app_state WHERE key = ${key}`) as { value: T }[];
  return rows.length ? rows[0].value : fallback;
}

export async function writeState<T>(key: string, value: T): Promise<void> {
  await ensureSchema();
  await sql()`INSERT INTO app_state (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

// ─── In-memory mutation helpers (call before writeDB) ────────────────────────
/** Append an activity log entry to the in-memory db (caller persists via writeDB). */
export function logActivity(db: AppDatabase, userId: string, username: string, action: string) {
  db.activityLogs.unshift({
    id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    userId,
    username,
    action,
    timestamp: new Date().toISOString(),
  });
  if (db.activityLogs.length > 500) db.activityLogs = db.activityLogs.slice(0, 500);
}

/** Reset the (vestigial) analytics cache so the next read recomputes. */
export function invalidateAnalytics(db: AppDatabase) {
  db.analyticsCache = { lastUpdated: new Date(0).toISOString(), preAggregated: null };
}

// ─── Client-safe sanitisation ────────────────────────────────────────────────
/** Strip secrets (password hashes) from a user before sending to the client. */
export function publicUser(u: User): User {
  const { password: _p, passwordHash: _h, ...rest } = u as User & { passwordHash?: string };
  return rest as User;
}

/** Return a copy of the DB with all user secrets removed. */
export function sanitizeDB(db: AppDatabase): AppDatabase {
  return { ...db, users: (db.users || []).map(publicUser) };
}
