import type { ServiceRecord } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reminders/status — bulk-update reminder status on service records.
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{ ids: string[]; status: ServiceRecord["reminderStatus"]; auth?: { userId?: string; username?: string } }>(req);
    const { ids, status } = body;
    const { userId, username } = actor(body);
    let count = 0;
    db.services = db.services.map((srv) => { if (ids.includes(srv.id)) { srv.reminderStatus = status; count++; } return srv; });
    logActivity(db, userId!, username!, `Updated ${count} reminders to "${status}"`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
