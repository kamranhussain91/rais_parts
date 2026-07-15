import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/purchases/:id/receive — mark a purchase received and apply stock/weighted-average.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDB();
    const body = await readBody<{ auth?: { userId?: string; username?: string } }>(req);
    const { userId, username } = actor(body);

    const idx = db.purchases.findIndex((p) => p.id === id);
    if (idx === -1) return fail("Purchase not found", 404);
    if (db.purchases[idx].status === "received") return fail("Purchase already received", 400);
    db.purchases[idx].status = "received";
    db.purchases[idx].items.forEach((item) => {
      const pIdx = db.products.findIndex((p) => p.id === item.productId);
      if (pIdx !== -1) {
        const oldStock = db.products[pIdx].stock;
        const oldPrice = db.products[pIdx].purchasePrice;
        if (oldStock + item.qty > 0) {
          db.products[pIdx].purchasePrice = Math.round(((oldStock * oldPrice) + (item.qty * item.purchasePrice)) / (oldStock + item.qty));
        } else { db.products[pIdx].purchasePrice = item.purchasePrice; }
        db.products[pIdx].stock += item.qty;
      }
    });
    logActivity(db, userId!, username!, `Purchase ${db.purchases[idx].invoiceRef} marked as received — inventory updated (+${db.purchases[idx].items.reduce((s, i) => s + i.qty, 0)} units)`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
