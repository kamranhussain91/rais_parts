/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from './AppContext';
import { PurchaseRecord, PurchaseItem, Product } from '../types';
import { 
  Plus, 
  Trash2, 
  FileText, 
  User, 
  Calendar, 
  CreditCard, 
  TrendingUp,
  Coins,
  CheckCircle
} from 'lucide-react';

export const PurchaseView: React.FC = () => {
  const { db, savePurchase, saveProduct } = useApp();

  // Active restock form states
  const [supplierName, setSupplierName] = useState('Honda Atlas Parts Ltd');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Mobile Wallet'>('Bank Transfer');
  const [bankAccountId, setBankAccountId] = useState('bank_1');

  // Selected item line states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [qty, setQty] = useState<number>(10);

  // Added items in active list
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  if (!db) return <div className="p-8 text-neutral-500">Loading procurement logs...</div>;

  const { products, purchases, accounts, suppliers } = db;

  // Sync pricing when product selection changes
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setPurchasePrice(prod.purchasePrice);
    }
  };

  // Add line item to draft purchase list
  const addItemLine = () => {
    if (!selectedProductId) {
      alert('Select a Honda catalog part first.');
      return;
    }
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    if (qty <= 0) {
      alert('Procurement quantity must be at least 1.');
      return;
    }

    setItems(prev => {
      // Check duplicate
      const exists = prev.findIndex(item => item.productId === selectedProductId);
      if (exists !== -1) {
        const updated = [...prev];
        updated[exists].qty += Number(qty);
        return updated;
      } else {
        return [...prev, {
          productId: selectedProductId,
          name: prod.name,
          partNumber: prod.partNumber,
          purchasePrice: Number(purchasePrice),
          qty: Number(qty)
        }];
      }
    });

    // Reset items select field
    setSelectedProductId('');
    setQty(10);
    setPurchasePrice(0);
  };

  const removeLineItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.purchasePrice * item.qty), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceRef.trim()) {
      alert('Please enter the Supplier invoice/bill voucher reference number.');
      return;
    }

    if (items.length === 0) {
      alert('Adding at least 1 product line to restock is mandatory.');
      return;
    }

    const payload: PurchaseRecord = {
      id: '',
      invoiceRef: invoiceRef.trim(),
      date: new Date().toISOString(),
      supplierName,
      items,
      totalAmount,
      paymentMethod,
      bankAccountId
    };

    const success = await savePurchase(payload);
    if (success) {
      // Clear states
      setItems([]);
      setInvoiceRef('');
    } else {
      alert('Error updating core accounting ledger. Check credit limit on payment cash box.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="purchase-view-container">
      
      {/* PROCUREMENT DRAUGHT FORM PANEL */}
      <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-neutral-100 shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-red-600" /> Procurement Purchase Entry (Stock Inflow)
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">Increases catalog stock levels & calculates weighted averages of costs</p>
        </div>

        <form onSubmit={handleSubmit} className="text-xs space-y-4">
          
          {/* Supplier, reference voucher and payments details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Supplier select */}
            <div>
              <label className="block text-neutral-500 font-bold mb-1.5">Select Wholesale Supplier Dealer</label>
              <select 
                className="w-full px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200 outline-hidden font-medium"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
                {/* Fallback option */}
                <option value="Direct Spot Market Purchase">Direct Market Spot Wholesalers</option>
              </select>
            </div>

            {/* Reference Voucher No */}
            <div>
              <label className="block text-neutral-500 font-bold mb-1.5">Supplier Invoice Reference #</label>
              <input 
                type="text" 
                required
                placeholder="e.g. HONDA-99120"
                className="w-full px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200 font-mono font-bold outline-hidden focus:bg-white focus:border-red-500"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
              />
            </div>

            {/* Payment selectors */}
            <div>
              <label className="block text-neutral-500 font-bold mb-1.5">Invoice Pay Method</label>
              <select 
                className="w-full px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200 outline-hidden"
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
              >
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Cash">Cash Ledger Chest</option>
                <option value="Mobile Wallet">Wholesale Wallet Trade</option>
              </select>
            </div>

            {/* Accounts selectors */}
            <div>
              <label className="block text-neutral-500 font-bold mb-1.5">Debit Outflow Account</label>
              <select 
                className="w-full px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200 outline-hidden"
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
              >
                {accounts.filter(acc => {
                  if (paymentMethod === 'Cash') return acc.id === 'cash_chest';
                  return acc.id !== 'cash_chest';
                }).map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.bankName} (Bal: Rs.{acc.balance})</option>
                ))}
              </select>
            </div>

          </div>

          <div className="border-t border-dashed border-neutral-100 pt-4" />

          {/* DYNAMIC ITEM LINE INCORPORATION */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-3">
            <span className="font-bold text-neutral-700 block text-xxs uppercase tracking-wider">Configure Inflow Part Lines</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              
              {/* Product select dropdown */}
              <div className="sm:col-span-5">
                <label className="block text-neutral-500 mb-1">Honda Part Title</label>
                <select 
                  className="w-full px-2 py-1.5 bg-white border border-neutral-200 rounded text-xxs font-medium"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  <option value="">-- Choose Part item --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Part: {p.partNumber})</option>
                  ))}
                </select>
              </div>

              {/* Buying price */}
              <div className="sm:col-span-3">
                <label className="block text-neutral-500 mb-1">Wholesale Purchase Price (Rs.)</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xxs font-mono"
                  value={purchasePrice === 0 ? '' : purchasePrice}
                  onChange={(e) => setPurchasePrice(Math.max(0, Number(e.target.value)))}
                />
              </div>

              {/* qty */}
              <div className="sm:col-span-2">
                <label className="block text-neutral-500 mb-1">In Bulk Qty</label>
                <input 
                  type="number" 
                  className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xxs font-mono"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                />
              </div>

              {/* Add trigger */}
              <div className="sm:col-span-2">
                <button 
                  type="button"
                  className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded font-bold text-xxs cursor-pointer flex items-center justify-center gap-1"
                  onClick={addItemLine}
                >
                  <Plus className="w-3.5 h-3.5" /> Append
                </button>
              </div>

            </div>
          </div>

          {/* Lines Table draft list */}
          <div className="border border-neutral-100 rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-400 font-bold uppercase text-[10px] border-b border-neutral-100">
                  <th className="py-2.5 px-3 text-left">Part Name</th>
                  <th className="py-2.5 px-3 text-center">Unit Cost</th>
                  <th className="py-2.5 px-3 text-center">Total Qty</th>
                  <th className="py-2.5 px-3 text-right">Aggregate</th>
                  <th className="py-2.5 px-3 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xxs font-medium text-neutral-600">
                {items.map((line, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 text-left">
                      <span className="font-bold text-neutral-800 block text-xs">{line.name}</span>
                      <span className="text-xxs font-mono text-neutral-400">P/N: {line.partNumber}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">Rs.{line.purchasePrice}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-neutral-800">{line.qty}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-800">Rs.{line.purchasePrice * line.qty}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button 
                        type="button" 
                        className="text-neutral-300 hover:text-rose-500 rounded p-1"
                        onClick={() => removeLineItem(idx)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-neutral-400">Your draft order is empty. Select catalog elements above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Submittals summary bar */}
          <div className="p-4 bg-red-50/50 rounded-xl border border-red-100/50 flex align-middle justify-between items-center">
            <div className="text-xs">
              <span className="block text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">Grand restock outflow sum</span>
              <span className="font-mono text-lg font-bold text-red-600">Rs.{totalAmount.toLocaleString()}</span>
            </div>
            <button 
              type="submit"
              disabled={items.length === 0}
              className={`px-5 py-2.5 font-bold rounded-lg text-white font-sans flex items-center gap-1.5 shadow-sm uppercase ${items.length === 0 ? 'bg-neutral-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer transition-colors'}`}
            >
              <CheckCircle className="w-4 h-4" /> Save restocking order
            </button>
          </div>

        </form>
      </div>

      {/* PROCUREMENT HISTORIES LOG TABLE */}
      <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-neutral-100 shadow-xs flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-600" /> restock order sheet (Vouchers)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Replenishment tracking list. Tap a card to select features</p>
          </div>
 
          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 text-xs">
            {purchases.map(pc => {
              const isSelected = selectedPurchaseId === pc.id;
              return (
                <div 
                  key={pc.id} 
                  className={`p-4 rounded-xl border select-none transition-all duration-300 transform hover:scale-[1.01] cursor-pointer flex flex-col gap-2.5 ${
                    isSelected 
                      ? 'bg-red-600 border-red-700 text-white shadow-md' 
                      : 'bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/30 text-slate-700'
                  }`}
                  onClick={() => setSelectedPurchaseId(isSelected ? null : pc.id)}
                  id={`purchase-card-${pc.id}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`font-black block text-xs ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        Ref: {pc.invoiceRef}
                      </span>
                      <span className={`text-[10px] flex items-center gap-1 mt-0.5 ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                        <Calendar className="w-3 h-3" /> {new Date(pc.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-red-50 border border-red-100 text-red-600 font-extrabold'
                    }`}>
                      Rs.{pc.totalAmount.toLocaleString()}
                    </span>
                  </div>
 
                  <div className={`text-[11px] border-t pt-2.5 space-y-2`} style={{ borderColor: isSelected ? 'rgba(255,255,255,0.15)' : '#f1f5f9' }}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>Supplier Room</span>
                      <span className={`font-extrabold ${isSelected ? 'text-white' : 'text-slate-700'}`}>{pc.supplierName}</span>
                    </div>

                    <div className={`max-h-20 overflow-y-auto space-y-1 p-2 rounded text-[10px] ${
                      isSelected ? 'bg-black/10 text-white' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {pc.items.map((line, idx) => (
                        <div key={idx} className="flex justify-between font-mono">
                          <span className="truncate max-w-[155px] font-sans font-medium">{line.name}</span>
                          <span>{line.qty} x Rs.{line.purchasePrice}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 justify-end text-[10px]">
                      <span className={isSelected ? 'text-red-200' : 'text-slate-400'}>Pay Method:</span>
                      <strong className={`uppercase font-mono ${isSelected ? 'text-white' : 'font-bold text-slate-700'}`}>{pc.paymentMethod}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
            {purchases.length === 0 && (
              <div className="py-12 text-center text-neutral-400">No procurement purchases recorded yet in database.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
