import type { SaleInvoice, SaleItem } from "@/types";
import { readDB, writeDB, logActivity, invalidateAnalytics } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";
import { updateInvoiceQRCodeAndHash } from "@/lib/fbr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// PUT /api/sales/:id — edit customer/payment/discount and/or items (restores &
// re-applies stock, recalculates tax + profit).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDB();
    const body = await readBody<{ updates: any; auth?: { userId?: string; username?: string } }>(req);
    const updates = body.updates || {};
    const { userId, username } = actor(body);
    const host = req.headers.get("host") || undefined;

    const invIdx = db.invoices.findIndex((inv) => inv.id === id);
    if (invIdx === -1) return fail("Invoice not found", 404);

    const original = db.invoices[invIdx];
    const newDiscount = updates.discount !== undefined ? Number(updates.discount) : original.discount;

    const updatedInvoice = {
      ...original,
      customerName: updates.customerName ?? original.customerName,
      customerPhone: updates.customerPhone ?? original.customerPhone,
      customerAddress: updates.customerAddress ?? original.customerAddress,
      customerBikeModel: updates.customerBikeModel ?? original.customerBikeModel,
      paymentMethod: updates.paymentMethod ?? original.paymentMethod,
      bankAccountId: updates.bankAccountId ?? original.bankAccountId,
      discount: newDiscount,
      notes: updates.notes ?? (original as any).notes,
    } as SaleInvoice;

    if (updates.items && Array.isArray(updates.items)) {
      original.items.forEach((oldItem) => {
        const pIdx = db.products.findIndex((p) => p.id === oldItem.productId);
        if (pIdx !== -1) db.products[pIdx].stock += oldItem.qty;
      });
      updates.items.forEach((newItem: SaleItem) => {
        const pIdx = db.products.findIndex((p) => p.id === newItem.productId);
        if (pIdx !== -1) db.products[pIdx].stock = Math.max(0, db.products[pIdx].stock - newItem.qty);
      });
      updatedInvoice.items = updates.items;

      const newSubtotal = updates.items.reduce((s: number, i: SaleItem) => s + i.sellingPrice * i.qty, 0);
      const taxRate = (original as any).taxRate ?? 18;
      const taxableSubtotal = Math.max(0, newSubtotal - newDiscount);
      const taxAmount = Math.round(taxableSubtotal * (taxRate / 100));
      const newProfit =
        updates.items.reduce((s: number, i: SaleItem) => s + (i.sellingPrice - i.purchasePrice) * i.qty, 0) - newDiscount;

      updatedInvoice.subtotal = newSubtotal;
      updatedInvoice.finalAmount = taxableSubtotal + taxAmount;
      updatedInvoice.profit = Math.max(0, newProfit);
      (updatedInvoice as any).taxRate = taxRate;
      (updatedInvoice as any).taxAmount = taxAmount;
    } else if (updates.discount !== undefined && Number(updates.discount) !== original.discount) {
      const taxRate = (original as any).taxRate ?? 18;
      const taxableSubtotal = Math.max(0, original.subtotal - newDiscount);
      const taxAmount = Math.round(taxableSubtotal * (taxRate / 100));
      (updatedInvoice as any).taxRate = taxRate;
      (updatedInvoice as any).taxAmount = taxAmount;
      updatedInvoice.finalAmount = taxableSubtotal + taxAmount;
      updatedInvoice.profit = Math.max(0, (original.profit ?? 0) + (original.discount - newDiscount));
    }

    await updateInvoiceQRCodeAndHash(updatedInvoice, host);
    db.invoices[invIdx] = updatedInvoice;

    logActivity(db, userId!, username!, `Edited invoice ${original.invoiceNumber} (${updates.items ? "items+" : ""}customer/payment)`);
    invalidateAnalytics(db);
    await writeDB(db);

    return dbResponse(db, { invoice: updatedInvoice });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
