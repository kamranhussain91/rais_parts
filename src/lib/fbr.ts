import crypto from "node:crypto";
import QRCode from "qrcode";
import type { AppDatabase, SaleInvoice } from "@/types";

export interface FbrConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  internetStatus: "Online" | "Offline";
  fbrServerStatus: "Operational" | "Downtime";
}

export const DEFAULT_FBR_CONFIG: FbrConfig = {
  apiUrl: "https://api.fbr.gov.pk/invoice/submit",
  apiKey: "fbr_atlas_honda_api_key_pk_2026",
  apiSecret: "fbr_hmac_sec_0918x23a",
  internetStatus: "Online",
  fbrServerStatus: "Operational",
};

export const MULTI_TERMINALS = [
  { id: "T1", name: "Billing Counter 1", location: "Main Gate Exit" },
  { id: "T2", name: "Billing Counter 2", location: "Spare Parts Lobby" },
  { id: "W1", name: "Workshop Mechanic Desk", location: "Bay 1 & Tuning" },
  { id: "A1", name: "Admin Manager Office", location: "Backoffice Cabin" },
];

export const FBR_CONFIG_KEY = "fbrConfig";
export const PARTS_LOCKS_KEY = "partsLocks";

export type PartsLocks = Record<string, { terminalId: string; lockTime: string }>;

export function generateInvoiceHash(invoice: Partial<SaleInvoice>): string {
  const payloadString = JSON.stringify({
    invoiceNumber: invoice.invoiceNumber,
    items: (invoice.items || []).map((item) => ({
      productId: item.productId,
      qty: item.qty,
      sellingPrice: item.sellingPrice,
    })),
    totalAmount: invoice.finalAmount,
    taxAmount: (invoice as { taxAmount?: number }).taxAmount || 0,
    timestamp: invoice.date,
  });
  return crypto.createHash("sha256").update(payloadString).digest("hex");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function updateInvoiceQRCodeAndHash(invoice: any, hostHeader?: string): Promise<any> {
  const hash = generateInvoiceHash(invoice);
  invoice.fbr_hash = hash;
  try {
    let domainUrl = "https://rais-honda.vercel.app";
    if (hostHeader) {
      const isLocal = hostHeader.includes("localhost") || hostHeader.includes("127.0.0.1");
      domainUrl = (isLocal ? "http://" : "https://") + hostHeader;
    }
    const verifyUrl = `${domainUrl}?invoice=${encodeURIComponent(invoice.fbrInvoiceNumber || invoice.invoiceNumber)}`;
    const qrImageBase64 = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 400,
      color: { dark: "#000000", light: "#ffffff" },
    });
    invoice.qr_image_path = qrImageBase64;
    invoice.fbr_verified_status = invoice.fbrStatus === "Approved" ? "Approved" : "Pending";
  } catch {
    // QR generation failure is non-fatal.
  }
  return invoice;
}

/**
 * Drain all Pending items in the FBR queue (shared by the manual /fbr/sync
 * endpoint and the Vercel cron worker). Mutates `db` in place; returns count of
 * items approved this pass.
 */
export async function drainFbrQueue(db: AppDatabase, config: FbrConfig, hostHeader?: string): Promise<number> {
  if (config.internetStatus === "Offline") return 0;
  let approved = 0;
  for (const item of (db.fbrSyncQueue || []).filter((q) => q.status === "Pending")) {
    item.lastAttempt = new Date().toISOString();
    item.retryCount += 1;
    const invoice = db.invoices.find((i) => i.id === item.invoiceId);
    if (!invoice) {
      item.status = "Rejected";
      item.errorMessage = "Invoice not found";
      continue;
    }
    if (config.fbrServerStatus === "Downtime") {
      item.errorMessage = "FBR 503: Gateway timeout";
      continue;
    }
    const fbrUsin = "12" + Math.floor(1000000000 + Math.random() * 9000000000);
    item.status = "Approved";
    item.errorMessage = undefined;
    (invoice as any).fbrStatus = "Approved";
    (invoice as any).fbrInvoiceNumber = fbrUsin;
    (invoice as any).fbrSubmitTime = new Date().toISOString();
    await updateInvoiceQRCodeAndHash(invoice, hostHeader);
    if (!db.terminalSyncLogs) db.terminalSyncLogs = [];
    db.terminalSyncLogs.unshift({
      id: "ts_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      terminalId: (invoice as any).terminalId || "T1",
      actionType: "SALE",
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      details: `FBR auto-synced ${invoice.invoiceNumber}. Ref: ${fbrUsin}`,
    });
    approved += 1;
  }
  return approved;
}
