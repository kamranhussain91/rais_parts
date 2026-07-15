import type { ServiceRecord } from "@/types";
import { readDB, writeDB, logActivity, invalidateAnalytics } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/services/:id — update a workshop service record.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDB();
    const body = await readBody<{ updates: Partial<ServiceRecord>; auth?: { userId?: string; username?: string } }>(req);
    const { userId, username } = actor(body);
    const idx = db.services.findIndex((s) => s.id === id);
    if (idx === -1) return fail("Service record not found", 404);
    const existing = db.services[idx];
    const updates = body.updates;
    const newLines = updates.serviceLines ?? existing.serviceLines;
    let newPrice: number; let newType: ServiceRecord["serviceType"];
    if (newLines && newLines.length > 0) {
      newPrice = newLines.reduce((sum, l) => sum + Number(l.price), 0);
      const hasOilChange = newLines.some((l) => l.serviceType === "Oil Change");
      newType = hasOilChange ? "Oil Change" : newLines[0].serviceType;
    } else {
      newPrice = updates.price !== undefined ? Number(updates.price) : existing.price;
      newType = (updates.serviceType ?? existing.serviceType);
    }
    const oldPrice = existing.price;
    const priceDiff = newPrice - oldPrice;
    if (priceDiff !== 0) {
      const cashIdx = db.accounts.findIndex((a) => a.id === "cash_chest");
      if (cashIdx !== -1) {
        db.accounts[cashIdx].balance += priceDiff;
        db.ledger.unshift({ id: "led_" + Date.now(), bankAccountId: "cash_chest", bankName: "Cash-in-Hand Drawer", date: new Date().toISOString(), type: priceDiff > 0 ? "Credit" : "Debit", amount: Math.abs(priceDiff), description: `Workshop edit adjustment: ${existing.invoiceNumber} (${priceDiff > 0 ? '+' : ''}Rs. ${priceDiff})`, balanceAfter: db.accounts[cashIdx].balance, referenceId: existing.id });
      }
    }
    let nextReminderDate = existing.nextReminderDate;
    let reminderStatus = existing.reminderStatus;
    if (newType === "Oil Change" && existing.serviceType !== "Oil Change") {
      const rd = new Date(); rd.setDate(rd.getDate() + 30);
      nextReminderDate = rd.toISOString(); reminderStatus = "Pending";
    } else if (newType !== "Oil Change") {
      nextReminderDate = undefined; reminderStatus = undefined;
    }
    db.services[idx] = {
      ...existing,
      customerName:  updates.customerName  ?? existing.customerName,
      customerPhone: updates.customerPhone ?? existing.customerPhone,
      bikeModel:     updates.bikeModel     ?? existing.bikeModel,
      serviceType:   newType,
      price:         newPrice,
      serviceLines:  newLines,
      notes:         updates.notes         ?? existing.notes,
      nextReminderDate,
      reminderStatus: (updates.reminderStatus ?? reminderStatus) as ServiceRecord["reminderStatus"],
    };
    logActivity(db, userId!, username!, `Workshop service ${existing.invoiceNumber} updated — Price: Rs. ${newPrice}`);
    invalidateAnalytics(db);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
