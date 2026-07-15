import type { BackupHistory } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/backup/create — record a backup metadata entry.
// Vercel serverless FS is read-only, so we do NOT write a file. We compute the
// size from the serialized JSON and persist only the metadata record.
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{ userId?: string; username?: string; type?: string }>(req);
    const userId = body.userId || "system";
    const username = body.username || "system";
    const type = body.type || "Manual";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `honda_backup_${timestamp}.json`;
    const size = Buffer.byteLength(JSON.stringify(db), "utf8");
    const record: BackupHistory = {
      id: "bk_" + Date.now(),
      timestamp: new Date().toISOString(),
      filename,
      size,
      type: type as "Auto" | "Manual",
    };
    db.backups.unshift(record);
    logActivity(db, userId, username, `Backup created: ${filename} (${Math.round(size / 1024)} KB)`);
    await writeDB(db);
    return dbResponse(db, { backupRecord: record });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
