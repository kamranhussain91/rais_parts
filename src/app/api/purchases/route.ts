import type { PurchaseRecord } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/purchases — create a new (pending) purchase order.
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{ purchase: PurchaseRecord; auth?: { userId?: string; username?: string } }>(req);
    const purchase = body.purchase;
    const { userId, username } = actor(body);

    purchase.id = "pur_" + Date.now();
    purchase.date = new Date().toISOString();
    purchase.status = "pending";
    if (!purchase.amountPaid) purchase.amountPaid = 0;
    if (purchase.supplierName && !db.suppliers.find((s) => s.name.toLowerCase() === purchase.supplierName.toLowerCase())) {
      db.suppliers.push({ id: "sup_" + Date.now(), name: purchase.supplierName, phone: "", address: "", balance: 0 });
    }
    db.purchases.unshift(purchase);
    const paid = purchase.amountPaid || 0;
    if (paid > 0) {
      const targetAccId = purchase.paymentMethod === "Cash" ? "cash_chest" : (purchase.bankAccountId || "bank_1");
      const accIdx = db.accounts.findIndex((a) => a.id === targetAccId);
      if (accIdx !== -1) {
        db.accounts[accIdx].balance -= paid;
        db.ledger.unshift({ id: "led_" + Date.now(), bankAccountId: targetAccId, bankName: db.accounts[accIdx].bankName, date: purchase.date, type: "Debit", amount: paid, description: `Purchase ${purchase.invoiceRef} (${purchase.supplierName})`, balanceAfter: db.accounts[accIdx].balance, referenceId: purchase.id });
      }
    }
    logActivity(db, userId!, username!, `Purchase Order ${purchase.invoiceRef} created (pending). Total: Rs. ${purchase.totalAmount}, Paid: Rs. ${paid}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
