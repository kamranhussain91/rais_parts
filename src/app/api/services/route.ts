import type { ServiceRecord } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/services — create a workshop service record.
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{ service: ServiceRecord; auth?: { userId?: string; username?: string } }>(req);
    const service = body.service;
    const { userId, username } = actor(body);

    if (service.serviceLines && service.serviceLines.length > 0) {
      service.price = service.serviceLines.reduce((sum, l) => sum + Number(l.price), 0);
      const hasOilChange = service.serviceLines.some((l) => l.serviceType === "Oil Change");
      service.serviceType = hasOilChange ? "Oil Change" : service.serviceLines[0].serviceType;
    }
    if (!service.invoiceNumber) {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const cnt = db.services.filter((s) => s.date.startsWith(new Date().toISOString().slice(0, 10))).length;
      service.invoiceNumber = `SRV-${todayStr}-${String(cnt + 1).padStart(3, "0")}`;
    }
    service.id = "srv_" + Date.now();
    service.date = new Date().toISOString();
    if (service.serviceType === "Oil Change") {
      const rd = new Date(); rd.setDate(rd.getDate() + 30);
      service.nextReminderDate = rd.toISOString();
      service.reminderStatus = "Pending";
    }
    if (service.customerPhone && !db.customers.find((c) => c.phone === service.customerPhone)) {
      db.customers.push({ id: "cust_" + Date.now(), name: service.customerName, phone: service.customerPhone, address: "", bikeModel: service.bikeModel });
    }
    db.services.push(service);
    const cashIdx = db.accounts.findIndex((a) => a.id === "cash_chest");
    if (cashIdx !== -1) {
      db.accounts[cashIdx].balance += service.price;
      const svcLabel = service.serviceLines && service.serviceLines.length > 1 ? `${service.serviceLines.length} services` : service.serviceType;
      db.ledger.unshift({ id: "led_" + Date.now(), bankAccountId: "cash_chest", bankName: "Cash-in-Hand Drawer", date: service.date, type: "Credit", amount: service.price, description: `Workshop: ${svcLabel} — ${service.invoiceNumber}`, balanceAfter: db.accounts[cashIdx].balance, referenceId: service.id });
    }
    logActivity(db, userId!, username!, `Workshop service ${service.invoiceNumber}. Earned: Rs. ${service.price}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
