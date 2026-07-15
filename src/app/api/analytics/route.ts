import { NextResponse } from "next/server";
import { readDB } from "@/lib/store";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET /api/analytics?startDate=&endDate= — business intelligence aggregation.
export async function GET(req: Request) {
  try {
    const db = await readDB();
    const params = new URL(req.url).searchParams;
    const sDate = params.get("startDate") ? new Date(params.get("startDate") as string) : new Date(0);
    const eDate = params.get("endDate") ? new Date(params.get("endDate") as string) : new Date();

    const filtInv = db.invoices.filter((i) => { const d = new Date(i.date); return d >= sDate && d <= eDate; });
    const filtSrv = db.services.filter((s) => { const d = new Date(s.date); return d >= sDate && d <= eDate; });
    const filtExp = db.expenses.filter((e) => { const d = new Date(e.date); return d >= sDate && d <= eDate; });

    let grossProductSales = 0, totalDiscounts = 0, costOfGoodsSold = 0, totalTax = 0;
    filtInv.forEach((inv) => {
      grossProductSales += inv.subtotal;
      totalDiscounts += inv.discount;
      totalTax += (inv as any).taxAmount || 0;
      inv.items.forEach((item) => { costOfGoodsSold += item.purchasePrice * item.qty; });
    });
    let grossWorkshopRevenue = 0; filtSrv.forEach((s) => { grossWorkshopRevenue += s.price; });
    let totalExpenses = 0; filtExp.forEach((e) => { totalExpenses += e.amount; });

    const grossRevenue = (grossProductSales - totalDiscounts) + grossWorkshopRevenue;
    const netProfit = grossRevenue - costOfGoodsSold - totalExpenses;
    const grossMargin = grossRevenue > 0 ? ((grossRevenue - costOfGoodsSold) / grossRevenue) * 100 : 0;
    const netMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    const hourlyPattern: Record<string, { hour: string; sales: number; count: number }> = {};
    for (let i = 0; i < 24; i++) { const h = String(i).padStart(2, "0") + ":00"; hourlyPattern[h] = { hour: h, sales: 0, count: 0 }; }
    filtInv.forEach((inv) => { const h = String(new Date(inv.date).getHours()).padStart(2, "0") + ":00"; if (hourlyPattern[h]) { hourlyPattern[h].sales += inv.finalAmount; hourlyPattern[h].count++; } });

    const pmCounts: Record<string, { name: string; value: number; total: number }> = { Cash: { name: "Cash", value: 0, total: 0 }, "Bank Transfer": { name: "Bank EFT", value: 0, total: 0 }, "Mobile Wallet": { name: "Wallet", value: 0, total: 0 } };
    filtInv.forEach((inv) => { const pm = inv.paymentMethod || "Cash"; if (pmCounts[pm]) { pmCounts[pm].value++; pmCounts[pm].total += inv.finalAmount; } });

    const custFreq: Record<string, { name: string; phone: string; count: number; totalSales: number }> = {};
    filtInv.forEach((inv) => { const ph = inv.customerPhone || "Walk-in"; if (!custFreq[ph]) custFreq[ph] = { name: inv.customerName || "Anonymous", phone: ph, count: 0, totalSales: 0 }; custFreq[ph].count++; custFreq[ph].totalSales += inv.finalAmount; });

    const prodQty: Record<string, { name: string; partNumber: string; qty: number }> = {};
    filtInv.forEach((inv) => { inv.items.forEach((item) => { if (!prodQty[item.productId]) prodQty[item.productId] = { name: item.name, partNumber: item.partNumber, qty: 0 }; prodQty[item.productId].qty += item.qty; }); });

    const soldIds = new Set(filtInv.flatMap((inv) => inv.items.map((it) => it.productId)));
    const deadStock = db.products.filter((p) => p.stock > 0 && !soldIds.has(p.id)).map((p) => ({ name: p.name, partNumber: p.partNumber, stock: p.stock, category: p.category, assetValue: p.purchasePrice * p.stock })).slice(0, 10);

    const svcTypes: Record<string, { name: string; count: number; revenue: number }> = {};
    filtSrv.forEach((s) => { if (!svcTypes[s.serviceType]) svcTypes[s.serviceType] = { name: s.serviceType, count: 0, revenue: 0 }; svcTypes[s.serviceType].count++; svcTypes[s.serviceType].revenue += s.price; });

    const oilChanges = db.services.filter((s) => s.serviceType === "Oil Change");
    const sentReminders = oilChanges.filter((s) => s.reminderStatus === "Sent" || s.reminderStatus === "Confirmed");
    const oilComplianceRate = oilChanges.length > 0 ? (sentReminders.length / oilChanges.length) * 100 : 100;

    const totalInventoryValue = db.products.reduce((acc, p) => acc + p.purchasePrice * p.stock, 0);

    return NextResponse.json({
      timeRange: { startDate: sDate, endDate: eDate },
      financials: { grossProductSales, grossWorkshopRevenue, totalDiscounts, totalTaxCollected: totalTax, totalExpenses, costOfGoodsSold, grossRevenue, netProfit, grossMargin, netMargin },
      hourlyPattern: Object.values(hourlyPattern),
      paymentRatios: Object.values(pmCounts),
      customerRatings: Object.values(custFreq).sort((a, b) => b.totalSales - a.totalSales).slice(0, 10),
      inventoryIntelligence: { fastMoving: Object.values(prodQty).sort((a, b) => b.qty - a.qty).slice(0, 10), deadStock, stockTurnover: costOfGoodsSold / (totalInventoryValue || 1), totalInventoryAssets: totalInventoryValue },
      workshopAnalytics: { servicesLog: Object.values(svcTypes), oilComplianceRate },
    });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
