import type { SaleInvoice, Customer, BankLedgerEntry } from "@/types";
import { readDB, writeDB, readState, writeState, logActivity, invalidateAnalytics } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";
import { updateInvoiceQRCodeAndHash, PARTS_LOCKS_KEY, type PartsLocks } from "@/lib/fbr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// POST /api/sales — create a sale invoice (tax, stock, FBR queue, ledger).
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{ invoice: SaleInvoice; auth?: { userId?: string; username?: string } }>(req);
    const invoice = body.invoice;
    if (!invoice) return fail("Missing invoice", 400);
    const { userId, username } = actor(body);
    const host = req.headers.get("host") || undefined;
    const locks = await readState<PartsLocks>(PARTS_LOCKS_KEY, {});
    const terminalId = (invoice as any).terminalId || "T1";

    const taxRate = (invoice as any).taxRate !== undefined ? (invoice as any).taxRate : 18;
    const taxableSubtotal = Math.max(0, invoice.subtotal - invoice.discount);
    const taxAmount = Math.round(taxableSubtotal * (taxRate / 100));
    (invoice as any).taxRate = taxRate;
    (invoice as any).taxAmount = taxAmount;
    invoice.finalAmount = taxableSubtotal + taxAmount;

    // Concurrency locks
    for (const item of invoice.items) {
      const lock = locks[item.productId];
      if (lock && lock.terminalId !== terminalId) {
        return fail(`Product locked by terminal '${lock.terminalId}'`, 409);
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const todayCount = db.invoices.filter(
      (inv) => inv.date.startsWith(new Date().toISOString().slice(0, 10)) && (inv as any).terminalId === terminalId,
    ).length;
    invoice.invoiceNumber = `${terminalId}-INV-${todayStr}-${String(todayCount + 1).padStart(3, "0")}`;
    invoice.id = "inv_" + Date.now();
    invoice.date = new Date().toISOString();
    (invoice as any).fbrStatus = "Pending";
    (invoice as any).terminalId = terminalId;

    let profit = 0;
    let locksChanged = false;
    invoice.items.forEach((item) => {
      const pIdx = db.products.findIndex((p) => p.id === item.productId);
      if (pIdx !== -1) {
        db.products[pIdx].stock = Math.max(0, db.products[pIdx].stock - item.qty);
        profit += (item.sellingPrice - item.purchasePrice) * item.qty;
        if (locks[item.productId]) {
          delete locks[item.productId];
          locksChanged = true;
        }
      }
    });
    invoice.profit = Math.max(0, profit - invoice.discount);

    // Upsert walk-in customer
    if (invoice.customerPhone && invoice.customerId === "Walk-in") {
      const existing = db.customers.find((c) => c.phone === invoice.customerPhone);
      if (existing) {
        invoice.customerId = existing.id;
      } else {
        const nc: Customer = {
          id: "cust_" + Date.now(),
          name: invoice.customerName || "Walk-in",
          phone: invoice.customerPhone,
          address: invoice.customerAddress || "",
          bikeModel: invoice.customerBikeModel || "",
        };
        db.customers.push(nc);
        invoice.customerId = nc.id;
      }
    }

    await updateInvoiceQRCodeAndHash(invoice, host);
    db.invoices.push(invoice);

    if (!db.fbrSyncQueue) db.fbrSyncQueue = [];
    db.fbrSyncQueue.push({
      id: "q_" + Date.now(),
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: "Pending",
      retryCount: 0,
    });
    if (!db.terminalSyncLogs) db.terminalSyncLogs = [];
    db.terminalSyncLogs.push({
      id: "ts_" + Date.now(),
      terminalId,
      actionType: "SALE",
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      details: `Receipt ${invoice.invoiceNumber}. Total: Rs. ${invoice.finalAmount}`,
    });

    const targetAccId = invoice.paymentMethod === "Cash" ? "cash_chest" : (invoice.bankAccountId || "bank_2");
    const accIdx = db.accounts.findIndex((a) => a.id === targetAccId);
    if (accIdx !== -1) {
      db.accounts[accIdx].balance += invoice.finalAmount;
      const entry: BankLedgerEntry = {
        id: "led_" + Date.now(),
        bankAccountId: targetAccId,
        bankName: db.accounts[accIdx].bankName,
        date: invoice.date,
        type: "Credit",
        amount: invoice.finalAmount,
        description: `Sale [${terminalId}] ${invoice.invoiceNumber} (${invoice.customerName})`,
        balanceAfter: db.accounts[accIdx].balance,
        referenceId: invoice.id,
      };
      db.ledger.unshift(entry);
    }

    logActivity(db, userId!, username!, `Created invoice ${invoice.invoiceNumber} on ${terminalId}. Total: Rs. ${invoice.finalAmount}`);
    invalidateAnalytics(db);
    await writeDB(db);
    if (locksChanged) await writeState(PARTS_LOCKS_KEY, locks);

    return dbResponse(db, { invoice });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
