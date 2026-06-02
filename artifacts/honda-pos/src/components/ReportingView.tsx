/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from './AppContext';
import { 
  BarChart, 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  Coins, 
  ClipboardCheck, 
  Building 
} from 'lucide-react';

export const ReportingView: React.FC = () => {
  const { db } = useApp();
  const [activeReport, setActiveReport] = useState<'sales' | 'profit' | 'expense' | 'inventory'>('sales');
  const [selectedReportRowId, setSelectedReportRowId] = useState<string | null>(null);

  if (!db) return <div className="p-8 text-neutral-500">Loading metrics engine...</div>;

  const { invoices, services, expenses, products, ledger, accounts } = db;

  // CSV exporting utility triggers clean Excel download
  const handleCSVExport = (headers: string[], rows: any[][], fileName: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", `${fileName}_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Convert currently loaded active report to CSV
  const triggerCSVDownload = () => {
    if (activeReport === 'sales') {
      const headers = ['Invoice Number', 'Date', 'Customer Name', 'Phone', 'Payment Method', 'Discount', 'Net Amount'];
      const rows = invoices.map(inv => [
        inv.invoiceNumber,
        inv.date.substring(0, 10),
        inv.customerName,
        inv.customerPhone,
        inv.paymentMethod,
        inv.discount,
        inv.finalAmount
      ]);
      handleCSVExport(headers, rows, 'honda_sales_report');
    } else if (activeReport === 'profit') {
      const headers = ['Sales Item / Job Ref', 'Transaction Date', 'Gross Revenue (Rs.)', 'Acquisition Cost (Rs.)', 'Net Itemized Profit (Rs.)'];
      const rows = [
        ...invoices.map(i => [
          i.invoiceNumber,
          i.date.substring(0, 10),
          i.finalAmount,
          i.finalAmount - i.profit,
          i.profit
        ]),
        ...services.map(s => [
          s.invoiceNumber,
          s.date.substring(0, 10),
          s.price,
          0, // service represents pure profit (labor)
          s.price
        ])
      ];
      handleCSVExport(headers, rows, 'honda_profit_analysis');
    } else if (activeReport === 'expense') {
      const headers = ['Voucher Date', 'Ledger Category', 'Justification description', 'Debit Cash Amount'];
      const rows = expenses.map(e => [
        e.date.substring(0, 10),
        e.category,
        e.description,
        e.amount
      ]);
      handleCSVExport(headers, rows, 'honda_expenses_statement');
    } else if (activeReport === 'inventory') {
      const headers = ['Honda Part Name', 'OEM Part Number', 'Barcode', 'Compatibility Fit', 'Wholesale Cost', 'Selling Price', 'Available Stock Units', 'Location Rack'];
      const rows = products.map(p => [
        p.name,
        p.partNumber,
        p.barcode,
        p.compatibility,
        p.purchasePrice,
        p.sellingPrice,
        p.stock,
        p.location
      ]);
      handleCSVExport(headers, rows, 'honda_inventory_audit');
    }
  };

  const triggerDirectPDFPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="reporting-view-container">
      
      {/* EXPORTING CONTROLLERS BAR */}
      <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-xs flex flex-col md:flex-row flex-wrap items-center justify-between gap-4 select-none">
        <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs w-full md:w-auto">
          <button 
            className={`px-3 py-1.5 rounded-md font-bold transition-all shrink-0 cursor-pointer ${activeReport === 'sales' ? 'bg-white text-red-600 shadow-xs' : 'text-neutral-500 hover:text-red-500'}`}
            onClick={() => setActiveReport('sales')}
          >
            Sales Receipts Report
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md font-bold transition-all shrink-0 cursor-pointer ${activeReport === 'profit' ? 'bg-white text-red-600 shadow-xs' : 'text-neutral-500 hover:text-red-500'}`}
            onClick={() => setActiveReport('profit')}
          >
            Profit & Revenue Statements
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md font-bold transition-all shrink-0 cursor-pointer ${activeReport === 'expense' ? 'bg-white text-red-600 shadow-xs' : 'text-neutral-500 hover:text-red-500'}`}
            onClick={() => setActiveReport('expense')}
          >
            Expense Statements
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md font-bold transition-all shrink-0 cursor-pointer ${activeReport === 'inventory' ? 'bg-white text-red-600 shadow-xs' : 'text-neutral-500 hover:text-red-500'}`}
            onClick={() => setActiveReport('inventory')}
          >
            Inventory Audit Sheet
          </button>
        </div>

        {/* CTA triggers */}
        <div className="flex items-center gap-2.5 w-full md:w-auto text-xxs">
          <button 
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            onClick={triggerCSVDownload}
          >
            <Download className="w-3.5 h-3.5" /> Export to Excel (.CSV)
          </button>

          <button 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            onClick={triggerDirectPDFPrint}
          >
            <Printer className="w-3.5 h-3.5" /> Export PDF / Print Report
          </button>
        </div>
      </div>

      {/* REPORT PRINTABLE WRAPPER */}
      <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-xs print-area space-y-6">
        
        {/* REPORT SHEET HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-lg font-black text-neutral-800 uppercase tracking-wide">
              {activeReport === 'sales' && 'Honda Bike Genuine Parts: Sales Receipt Audit Log'}
              {activeReport === 'profit' && 'Core Financials: Profit & Gross Revenue Analysis'}
              {activeReport === 'expense' && 'Business Ledger: Overhead Expenses Sheet'}
              {activeReport === 'inventory' && 'Hardware Stockyards: Dynamic Inventory Audit Sheet'}
            </h1>
            <p className="text-xs text-neutral-400 font-sans">
              Statement Generation Date: <strong>June 1, 2026</strong> | Shop Location: Allama Iqbal Road, Dharampura, Lahore
            </p>
          </div>
          <span className="text-xxs px-2.5 py-1 bg-neutral-100 text-neutral-500 rounded border border-neutral-250 font-mono font-bold uppercase tracking-wider">
            Honda POS System Report
          </span>
        </div>

        {/* METRICS ACCORDIONS */}
        {activeReport === 'sales' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-xs font-sans text-center">
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Total Sales Memo count</span>
                <strong className="text-base text-neutral-800">{invoices.length} Slips</strong>
              </div>
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Gross Invoices Turnover</span>
                <strong className="text-base text-red-600 font-mono">Rs.{invoices.reduce((sum, i) => sum + i.finalAmount, 0).toLocaleString()}</strong>
              </div>
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Overall discounts granted</span>
                <strong className="text-base text-rose-500 font-mono">Rs.{invoices.reduce((sum, i) => sum + i.discount, 0).toLocaleString()}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="sales-report-cards">
              {invoices.map(inv => {
                const isSelected = selectedReportRowId === inv.id;
                return (
                  <div 
                    key={inv.id}
                    className={`p-4 border rounded-xl select-none transition-all duration-300 transform hover:scale-[1.01] cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected 
                        ? 'bg-red-600 border-red-700 text-white shadow-md' 
                        : 'bg-white border-slate-200 hover:border-red-150 hover:bg-red-50/10 text-slate-700'
                    }`}
                    onClick={() => setSelectedReportRowId(isSelected ? null : inv.id)}
                    id={`report-sales-card-${inv.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`font-black text-sm block ${isSelected ? 'text-white' : 'text-slate-900'}`}>{inv.invoiceNumber}</span>
                        <span className={`text-[10px] font-mono block mt-0.5 ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>{inv.date.substring(0, 10)}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {inv.paymentMethod}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className={`font-bold block text-xs ${isSelected ? 'text-red-50' : 'text-slate-700'}`}>{inv.customerName}</span>
                      <span className={`text-[10px] font-mono block ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>{inv.customerPhone}</span>
                    </div>

                    <div className="pt-2 border-t flex justify-between items-end" style={{ borderColor: isSelected ? 'rgba(255,255,255,0.15)' : '#f1f5f9' }}>
                      <div>
                        <span className={`block text-[8px] uppercase tracking-wider font-extrabold ${isSelected ? 'text-red-200' : 'text-slate-400'}`}>Discount Given</span>
                        <span className={`font-mono font-bold text-xs ${isSelected ? 'text-white' : 'text-rose-550'}`}>Rs.{inv.discount}</span>
                      </div>
                      <div className="text-right">
                        <span className={`block text-[8px] uppercase tracking-wider font-extrabold ${isSelected ? 'text-red-200' : 'text-slate-400'}`}>Net Sales Paid</span>
                        <span className={`font-mono font-black text-sm ${isSelected ? 'text-white' : 'text-slate-950 font-extrabold'}`}>Rs.{inv.finalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeReport === 'profit' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-xs font-sans text-center">
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Store Product Margin (Rs.)</span>
                <strong className="text-base text-neutral-800 font-mono">Rs.{invoices.reduce((sum, i) => sum + i.profit, 0).toLocaleString()}</strong>
              </div>
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Mechanics charges margin</span>
                <strong className="text-base text-emerald-600 font-mono">Rs.{services.reduce((sum, s) => sum + s.price, 0).toLocaleString()}</strong>
              </div>
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Overall Gross income yield (month)</span>
                <strong className="text-base text-red-600 font-mono">
                  Rs.{(invoices.reduce((sum, i) => sum + i.profit, 0) + services.reduce((sum, s) => sum + s.price, 0)).toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="profit-report-cards">
              {/* Sales Invoice Profits */}
              {invoices.map(inv => {
                const combinedId = `inv_${inv.id}`;
                const isSelected = selectedReportRowId === combinedId;
                return (
                  <div 
                    key={combinedId}
                    className={`p-4 border rounded-xl select-none transition-all duration-300 transform hover:scale-[1.01] cursor-pointer flex flex-col justify-between gap-3.5 ${
                      isSelected 
                        ? 'bg-red-600 border-red-700 text-white shadow-md' 
                        : 'bg-white border-slate-200 hover:border-red-150 hover:bg-red-50/10 text-slate-700'
                    }`}
                    onClick={() => setSelectedReportRowId(isSelected ? null : combinedId)}
                    id={`report-profit-card-${combinedId}`}
                  >
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Retail Cash Memo
                      </span>
                      <h4 className={`text-sm font-extrabold mt-1.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{inv.invoiceNumber}</h4>
                      <span className={`text-[10px] font-mono block mt-0.5 ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>{inv.date.substring(0, 10)}</span>
                    </div>

                    <div className="border-t pt-2.5 space-y-1.5" style={{ borderColor: isSelected ? 'rgba(255,255,255,0.15)' : '#f1f5f9' }}>
                      <div className="flex justify-between items-center text-xs">
                        <span className={isSelected ? 'text-red-100' : 'text-slate-400'}>Direct Revenue:</span>
                        <span className="font-mono font-bold">Rs.{inv.finalAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={isSelected ? 'text-red-100' : 'text-slate-400'}>Buying Cost:</span>
                        <span className="font-mono text-rose-500">Rs.{inv.finalAmount - inv.profit}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed" style={{ borderColor: isSelected ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }}>
                        <span className={`font-black ${isSelected ? 'text-white font-extrabold' : 'text-slate-700'}`}>Net Product Margin:</span>
                        <span className="font-mono font-black text-emerald-500">Rs.{inv.profit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Service Profitable Logs */}
              {services.map(srv => {
                const combinedId = `srv_${srv.id}`;
                const isSelected = selectedReportRowId === combinedId;
                return (
                  <div 
                    key={combinedId}
                    className={`p-4 border rounded-xl select-none transition-all duration-300 transform hover:scale-[1.01] cursor-pointer flex flex-col justify-between gap-3.5 ${
                      isSelected 
                        ? 'bg-red-600 border-red-700 text-white shadow-md' 
                        : 'bg-white border-slate-200 hover:border-red-150 hover:bg-red-50/10 text-slate-705'
                    }`}
                    onClick={() => setSelectedReportRowId(isSelected ? null : combinedId)}
                    id={`report-profit-card-${combinedId}`}
                  >
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        isSelected ? 'bg-emerald-600/30 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        Workshop Service ({srv.serviceType})
                      </span>
                      <h4 className={`text-sm font-extrabold mt-1.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{srv.invoiceNumber}</h4>
                      <span className={`text-[10px] font-mono block mt-0.5 ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>{srv.date.substring(0, 10)}</span>
                    </div>

                    <div className="border-t pt-2.5 space-y-1.5" style={{ borderColor: isSelected ? 'rgba(255,255,255,0.15)' : '#f1f5f9' }}>
                      <div className="flex justify-between items-center text-xs">
                        <span className={isSelected ? 'text-red-100' : 'text-slate-400'}>Labor Fee:</span>
                        <span className="font-mono font-bold font-semibold">Rs.{srv.price}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={isSelected ? 'text-red-100' : 'text-slate-400'}>Acquisition:</span>
                        <span className="font-mono text-neutral-400">Rs.0</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed" style={{ borderColor: isSelected ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }}>
                        <span className={`font-black ${isSelected ? 'text-white font-extrabold' : 'text-slate-700'}`}>Net Labor Margin:</span>
                        <span className="font-mono font-black text-emerald-500 font-extrabold">Rs.{srv.price}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeReport === 'expense' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs font-sans text-center">
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Rent / Salaries overhead sums</span>
                <strong className="text-base text-neutral-800 font-mono">
                  Rs.{expenses.filter(e => e.category === 'Rent' || e.category === 'Salary').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </strong>
              </div>
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Utilities & miscellaneous overhauls</span>
                <strong className="text-base text-rose-600 font-mono">
                  Rs.{expenses.filter(e => e.category !== 'Rent' && e.category !== 'Salary').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="expense-report-cards">
              {expenses.map(e => {
                const isSelected = selectedReportRowId === e.id;
                return (
                  <div 
                    key={e.id}
                    className={`p-4 border rounded-xl select-none transition-all duration-300 transform hover:scale-[1.01] cursor-pointer flex flex-col justify-between gap-3.5 ${
                      isSelected 
                        ? 'bg-red-600 border-red-700 text-white shadow-md' 
                        : 'bg-white border-slate-200 hover:border-red-150 hover:bg-red-50/10 text-slate-700'
                    }`}
                    onClick={() => setSelectedReportRowId(isSelected ? null : e.id)}
                    id={`report-expense-card-${e.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {e.category}
                      </span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-red-100' : 'text-slate-404 text-slate-400'}`}>
                        {e.date.substring(0, 10)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[8px] uppercase font-extrabold tracking-wider block ${isSelected ? 'text-red-200' : 'text-slate-400'}`}>Memo Details</span>
                      <p className={`text-xs font-semibold leading-normal line-clamp-3 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {e.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t text-right" style={{ borderColor: isSelected ? 'rgba(255,255,255,0.15)' : '#f1f5f9' }}>
                      <span className={`block text-[8px] uppercase tracking-wider font-extrabold ${isSelected ? 'text-red-200' : 'text-slate-400'}`}>Debit Disbursed</span>
                      <strong className={`font-mono text-sm ${isSelected ? 'text-white font-extrabold' : 'text-rose-600 font-extrabold'}`}>Rs.{e.amount.toLocaleString()}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeReport === 'inventory' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs font-sans text-center">
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Total stock yard listings count</span>
                <strong className="text-base text-neutral-800">{products.length} Items</strong>
              </div>
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100">
                <span className="block text-neutral-400 font-bold uppercase text-[9px] mb-1">Aggregated Asset Capital evaluation cost</span>
                <strong className="text-base text-emerald-600 font-mono">
                  Rs.{products.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0).toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="inventory-report-cards">
              {products.map(p => {
                const isSelected = selectedReportRowId === p.id;
                return (
                  <div 
                    key={p.id}
                    className={`p-4 border rounded-xl select-none transition-all duration-300 transform hover:scale-[1.01] cursor-pointer flex flex-col justify-between gap-3.5 ${
                      isSelected 
                        ? 'bg-red-600 border-red-700 text-white shadow-md' 
                        : 'bg-white border-slate-200 hover:border-red-150 hover:bg-red-50/10 text-slate-700'
                    }`}
                    onClick={() => setSelectedReportRowId(isSelected ? null : p.id)}
                    id={`report-inventory-card-${p.id}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.partNumber}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          isSelected ? 'bg-white/10 border-white/10 text-white' : 'bg-blue-50 border-blue-100 text-blue-700'
                        }`}>
                          {p.location || 'No Rack'}
                        </span>
                      </div>
                      
                      <h4 className={`text-xs font-black mt-2.5 tracking-tight line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{p.name}</h4>
                      <span className={`text-[10px] font-mono block mt-1 ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>Barcode: {p.barcode}</span>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold ${isSelected ? 'text-red-200' : 'text-slate-400'}`}>Bike Compatibility</span>
                      <p className={`text-xxs font-semibold ${isSelected ? 'text-white' : 'text-slate-700'}`}>{p.compatibility}</p>
                    </div>

                    <div className="pt-2 border-t flex justify-between items-end" style={{ borderColor: isSelected ? 'rgba(255,255,255,0.15)' : '#f1f5f9' }}>
                      <div>
                        <span className={`block text-[8px] uppercase tracking-wider font-extrabold ${isSelected ? 'text-red-200' : 'text-slate-400'}`}>Standard Cost</span>
                        <span className="font-mono text-xs font-bold">Rs.{p.purchasePrice}</span>
                      </div>
                      <div className="text-right">
                        <span className={`block text-[8px] uppercase tracking-wider font-bold ${isSelected ? 'text-red-200' : 'text-slate-400'}`}>Available balance</span>
                        <span className={`font-mono text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{p.stock} Units</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
