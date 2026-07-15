import { readDB, writeDB } from "@/lib/store";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET /api/sales/verify?invoice=... — public invoice verification.
export async function GET(req: Request) {
  try {
    const invoiceNumber = new URL(req.url).searchParams.get("invoice") || "";
    if (!invoiceNumber) return fail("Invoice number required.", 400);

    const db = await readDB();
    const invoice = db.invoices.find(
      (inv) =>
        inv.invoiceNumber === invoiceNumber ||
        inv.id === invoiceNumber ||
        (inv as any).fbrInvoiceNumber === invoiceNumber,
    );
    if (!invoice) return fail(`Invoice '${invoiceNumber}' not found.`, 404);

    if (!db.terminalSyncLogs) db.terminalSyncLogs = [];
    db.terminalSyncLogs.unshift({
      id: "ts_verify_" + Date.now(),
      terminalId: (invoice as any).terminalId || "T1",
      actionType: "SALE",
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      details: `Audit query for ${invoice.invoiceNumber}. Verified.`,
    });
    await writeDB(db);

    return ok({
      invoice,
      storeDetails: {
        name: "Rais Honda Motor Labs & Parts",
        ntn: "8125439-0",
        address: "Main Chowk Road, Multan, Pakistan",
        phone: "+92-300-9805610",
        tagline: "Premium Automotive Honda Parts & Mechanical SLA Labs",
      },
    });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
