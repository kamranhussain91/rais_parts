import { NextResponse } from "next/server";
import { readDB, sanitizeDB } from "@/lib/store";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/db — full database snapshot (password hashes stripped).
// Returns the raw DB object (AppContext.refreshData consumes it directly).
export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(sanitizeDB(db));
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
