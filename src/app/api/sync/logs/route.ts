import { NextResponse } from "next/server";
import { readDB } from "@/lib/store";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/sync/logs — terminal sync log feed.
export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(db.terminalSyncLogs || []);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
