import { NextResponse } from "next/server";
import { readDB, writeDB, readState } from "@/lib/store";
import { fail } from "@/lib/http";
import { drainFbrQueue, DEFAULT_FBR_CONFIG, FBR_CONFIG_KEY, type FbrConfig } from "@/lib/fbr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/fbr/queue — pending FBR sync queue + current config.
// On the free Vercel plan cron only runs daily, so we opportunistically drain
// any pending items here (when online) — this keeps FBR near real-time without
// depending on a frequent scheduler.
export async function GET(req: Request) {
  try {
    const db = await readDB();
    const config = await readState<FbrConfig>(FBR_CONFIG_KEY, DEFAULT_FBR_CONFIG);

    if (config.internetStatus !== "Offline" && (db.fbrSyncQueue || []).some((q) => q.status === "Pending")) {
      const host = req.headers.get("host") || undefined;
      const synced = await drainFbrQueue(db, config, host);
      if (synced > 0) await writeDB(db);
    }

    return NextResponse.json({ queue: db.fbrSyncQueue || [], config });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
