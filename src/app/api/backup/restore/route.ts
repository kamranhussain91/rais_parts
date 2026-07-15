import type { AppDatabase } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/backup/restore — replace the database with an uploaded backup.
export async function POST(req: Request) {
  try {
    const body = await readBody<{
      backupData: AppDatabase;
      auth?: { userId?: string; username?: string };
    }>(req);
    const { backupData } = body;
    const { userId, username } = actor(body);
    if (!backupData || typeof backupData !== "object") return fail("Invalid backup structure.", 400);
    if (!backupData.products || !backupData.invoices || !backupData.services || !backupData.accounts) {
      return fail("Backup missing required tables.", 400);
    }
    const oldDB = await readDB();
    const restored: AppDatabase = { ...backupData, users: backupData.users || oldDB.users, backups: oldDB.backups };
    await writeDB(restored);
    logActivity(restored, userId!, username!, `Database restored with ${restored.products?.length || 0} products`);
    return dbResponse(restored);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
