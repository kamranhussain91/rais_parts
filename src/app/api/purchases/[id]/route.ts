import type { PurchaseRecord } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/purchases/:id — update an existing purchase (re-applies stock/weighted-average when already received).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDB();
    const body = await readBody<{ purchase: PurchaseRecord; auth?: { userId?: string; username?: string } }>(req);
    const { userId, username } = actor(body);

    const idx = db.purchases.findIndex((p) => p.id === id);
    if (idx === -1) return fail("Purchase not found", 404);
    const existing = db.purchases[idx];
    const updates = body.purchase;
    if (existing.status === "received") {
      existing.items.forEach((oldItem) => {
        const pIdx = db.products.findIndex((p) => p.id === oldItem.productId);
        if (pIdx !== -1) { db.products[pIdx].stock = Math.max(0, db.products[pIdx].stock - oldItem.qty); }
      });
      updates.items.forEach((newItem) => {
        const pIdx = db.products.findIndex((p) => p.id === newItem.productId);
        if (pIdx !== -1) {
          const curStock = db.products[pIdx].stock;
          const curPrice = db.products[pIdx].purchasePrice;
          if (curStock + newItem.qty > 0) {
            db.products[pIdx].purchasePrice = Math.round(((curStock * curPrice) + (newItem.qty * newItem.purchasePrice)) / (curStock + newItem.qty));
          } else { db.products[pIdx].purchasePrice = newItem.purchasePrice; }
          db.products[pIdx].stock += newItem.qty;
        }
      });
    }
    db.purchases[idx] = {
      ...existing,
      supplierName:  updates.supplierName  || existing.supplierName,
      date:          updates.date          || existing.date,
      items:         updates.items,
      totalAmount:   updates.totalAmount,
      amountPaid:    updates.amountPaid    ?? existing.amountPaid,
      paymentMethod: updates.paymentMethod || existing.paymentMethod,
      bankAccountId: updates.bankAccountId ?? existing.bankAccountId,
      notes:         updates.notes,
    };
    logActivity(db, userId!, username!, `Purchase ${existing.invoiceRef} updated — Total: Rs. ${updates.totalAmount}, Paid: Rs. ${updates.amountPaid}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
