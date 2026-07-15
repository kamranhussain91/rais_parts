import { NextResponse } from "next/server";
import { readDB, writeDB, readState } from "@/lib/store";
import { fail } from "@/lib/http";
import { drainFbrQueue, DEFAULT_FBR_CONFIG, FBR_CONFIG_KEY, type FbrConfig } from "@/lib/fbr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/cron/fbr — Vercel Cron worker (replaces the old setInterval). Drains
// the pending FBR queue once per invocation. Scheduled in vercel.json.
export async function GET() {
  try {
    const config = await readState<FbrConfig>(FBR_CONFIG_KEY, DEFAULT_FBR_CONFIG);
    const db = await readDB();
    const synced = await drainFbrQueue(db, config);
    if (synced > 0) await writeDB(db);
    return NextResponse.json({ success: true, synced });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

// Allow manual POST triggering too.
export const POST = GET;
