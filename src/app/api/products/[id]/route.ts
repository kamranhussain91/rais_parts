import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/products/:id — body is { userId, username } (root-level, not `auth`).
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDB();
    const body = await readBody<{ userId?: string; username?: string }>(req);
    const userId = body.userId || "system";
    const username = body.username || "system";

    const prod = db.products.find((p) => p.id === id);
    if (prod) {
      db.products = db.products.filter((p) => p.id !== id);
      logActivity(db, userId, username, `Deleted product: ${prod.name}`);
      await writeDB(db);
    }
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
