import { readDB, writeDB, readState, invalidateAnalytics } from "@/lib/store";
import { dbResponse, fail } from "@/lib/http";
import { drainFbrQueue, DEFAULT_FBR_CONFIG, FBR_CONFIG_KEY, type FbrConfig } from "@/lib/fbr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/fbr/sync — manually drain the pending FBR queue.
export async function POST(req: Request) {
  try {
    const config = await readState<FbrConfig>(FBR_CONFIG_KEY, DEFAULT_FBR_CONFIG);
    if (config.internetStatus === "Offline") {
      return fail("Cannot sync: workstation in OFFLINE mode.", 400);
    }
    const db = await readDB();
    const host = req.headers.get("host") || undefined;
    const syncedItems = await drainFbrQueue(db, config, host);
    invalidateAnalytics(db);
    await writeDB(db);
    return dbResponse(db, { syncedItems });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
