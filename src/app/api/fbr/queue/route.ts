import { NextResponse } from "next/server";
import { readDB, readState } from "@/lib/store";
import { fail } from "@/lib/http";
import { DEFAULT_FBR_CONFIG, FBR_CONFIG_KEY, type FbrConfig } from "@/lib/fbr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/fbr/queue — pending FBR sync queue + current config.
export async function GET() {
  try {
    const db = await readDB();
    const config = await readState<FbrConfig>(FBR_CONFIG_KEY, DEFAULT_FBR_CONFIG);
    return NextResponse.json({ queue: db.fbrSyncQueue || [], config });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
