import React, { useState, useRef, useEffect } from 'react';
import { useApp } from './AppContext';
import { PurchaseRecord, PurchaseItem, Product } from '../types';
import { Plus, Trash2, X, Eye, CheckCircle, Search, ChevronDown, Package } from 'lucide-react';

// ─── Searchable Product Dropdown ─────────────────────────────────────────────
interface ProductDropdownProps {
  products: Product[];
  selectedId: string;
  onSelect: (product: Product) => void;
}

const ProductDropdown: React.FC<ProductDropdownProps> = ({ products, selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = products.find(p => p.id === selectedId);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.partNumber.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs hover:border-slate-300 focus:outline-none focus:border-red-400 transition-colors"
      >
        <span className={selected ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {selected ? selected.name : 'Select product...'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-md">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by name or part no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No products found</div>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onSelect(p); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2.5 hover:bg-red-50 transition-colors flex items-start gap-2 ${p.id === selectedId ? 'bg-red-50' : ''}`}
                >
                  <Package className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">P/N: {p.partNumber} · Stock: {p.stock} · Rs. {p.purchasePrice}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Draft item row type ──────────────────────────────────────────────────────
interface DraftItem {
  productId: string;
  name: string;
  partNumber: string;
  qty: number;
  unitCost: number;
}

// ─── View Purchase Modal ──────────────────────────────────────────────────────
interface ViewModalProps {
  purchase: PurchaseRecord;
  onClose: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ purchase, onClose }) => {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Purchase Order Details</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{purchase.invoiceRef}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Supplier</p><p className="font-bold text-slate-800">{purchase.supplierName}</p></div>
            <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Date</p><p className="font-bold text-slate-800">{fmt(purchase.date)}</p></div>
            <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Total Amount</p><p className="font-bold text-red-600 font-mono">Rs. {purchase.totalAmount.toLocaleString()}</p></div>
            <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Amount Paid</p><p className="font-bold text-slate-800 font-mono">Rs. {(purchase.amountPaid || 0).toLocaleString()}</p></div>
            <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Payment</p><p className="font-semibold text-slate-700">{purchase.paymentMethod}</p></div>
            <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${purchase.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {purchase.status === 'received' ? 'Received' : 'Pending'}
              </span>
            </div>
          </div>
          {purchase.notes && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Notes</p>
              {purchase.notes}
            </div>
          )}
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-2">Items ({purchase.items.length})</p>
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Product</th>
                    <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-500 uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Unit Cost</th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchase.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.partNumber}</p>
                      </td>
                      <td className="px-3 py-2 text-center font-mono">{item.qty}</td>
                      <td className="px-3 py-2 text-right font-mono">Rs. {item.purchasePrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">Rs. {(item.purchasePrice * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── New Purchase Modal ───────────────────────────────────────────────────────
interface NewPurchaseModalProps {
  products: Product[];
  suppliers: { id: string; name: string }[];
  accounts: { id: string; bankName: string; balance: number }[];
  onClose: () => void;
  onSave: (purchase: PurchaseRecord) => Promise<boolean>;
}

const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({ products, suppliers, accounts, onClose, onSave }) => {
  const [supplierName, setSupplierName] = useState('');
  const [invoiceRef] = useState(() => `PO-${Math.floor(100000 + Math.random() * 900000)}`);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Mobile Wallet'>('Bank Transfer');
  const [bankAccountId, setBankAccountId] = useState(() => accounts.find(a => a.id !== 'cash_chest')?.id || accounts[0]?.id || '');
  const [items, setItems] = useState<DraftItem[]>([{ productId: '', name: '', partNumber: '', qty: 1, unitCost: 0 }]);
  const [saving, setSaving] = useState(false);

  const total = items.reduce((s, i) => s + i.qty * i.unitCost, 0);

  const addItem = () => setItems(prev => [...prev, { productId: '', name: '', partNumber: '', qty: 1, unitCost: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof DraftItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleProductSelect = (idx: number, product: Product) => {
    setItems(prev => prev.map((item, i) => i === idx ? {
      ...item,
      productId: product.id,
      name: product.name,
      partNumber: product.partNumber,
      unitCost: product.purchasePrice
    } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return alert('Please select a supplier.');
    if (items.some(i => !i.productId)) return alert('Please select a product for each item row.');
    if (items.some(i => i.qty < 1)) return alert('Quantity must be at least 1 for all items.');

    setSaving(true);
    const purchaseItems: PurchaseItem[] = items.map(i => ({
      productId: i.productId,
      name: i.name,
      partNumber: i.partNumber,
      purchasePrice: i.unitCost,
      qty: i.qty
    }));

    const purchase: PurchaseRecord = {
      id: '',
      invoiceRef,
      date: new Date(date).toISOString(),
      supplierName,
      items: purchaseItems,
      totalAmount: total,
      amountPaid,
      paymentMethod,
      bankAccountId,
      status: 'pending',
      notes: notes.trim() || undefined
    };

    const ok = await onSave(purchase);
    setSaving(false);
    if (ok) onClose();
    else alert('Failed to save purchase order. Please try again.');
  };

  const filteredAccounts = accounts.filter(a =>
    paymentMethod === 'Cash' ? a.id === 'cash_chest' : a.id !== 'cash_chest'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-800">New Purchase Order</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Row 1: Supplier + Invoice Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 bg-white appearance-none cursor-pointer"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={invoiceRef}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 text-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Row 2: Date + Amount Paid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount Paid (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid || ''}
                  onChange={e => setAmountPaid(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                />
              </div>
            </div>

            {/* Row 3: Payment Method + Account */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Mobile Wallet">Mobile Wallet</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Debit Account</label>
                <select
                  value={bankAccountId}
                  onChange={e => setBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 bg-white"
                >
                  {filteredAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} (Rs. {a.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 resize-none"
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Items <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Qty</th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider w-28">Unit Cost</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Total</th>
                      <th className="px-3 py-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2">
                          <ProductDropdown
                            products={products}
                            selectedId={item.productId}
                            onSelect={p => handleProductSelect(idx, p)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={e => updateItem(idx, 'qty', Math.max(1, Number(e.target.value)))}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-mono text-center outline-none focus:border-red-400"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.unitCost || ''}
                            onChange={e => updateItem(idx, 'unitCost', Math.max(0, Number(e.target.value)))}
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-mono text-center outline-none focus:border-red-400"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs font-bold text-slate-800">
                          Rs. {(item.qty * item.unitCost).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-slate-50">
                      <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold text-slate-600">Total:</td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-red-600">
                        Rs. {total.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              {saving ? 'Saving...' : 'Create Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main PurchaseView ────────────────────────────────────────────────────────
export const PurchaseView: React.FC = () => {
  const { db, savePurchase, receivePurchase } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<PurchaseRecord | null>(null);

  if (!db) return <div className="p-8 text-slate-400 text-sm">Loading purchases...</div>;

  const { purchases, products, suppliers, accounts } = db;

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleReceive = async (id: string) => {
    if (!confirm('Mark this purchase as received?')) return;
    await receivePurchase(id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Purchase
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Invoice No</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid</th>
              <th className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                  No purchase orders yet. Click "+ New Purchase" to create one.
                </td>
              </tr>
            )}
            {purchases.map(pc => (
              <tr key={pc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="font-bold text-xs font-mono text-slate-800">{pc.invoiceRef}</span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-600">{fmt(pc.date)}</td>
                <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">{pc.supplierName}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-bold text-slate-800 font-mono">Rs. {pc.totalAmount.toLocaleString()}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-slate-600 font-mono">Rs. {(pc.amountPaid || 0).toLocaleString()}</span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    pc.status === 'received'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {pc.status === 'received' ? 'received' : 'pending'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setViewPurchase(pc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {pc.status !== 'received' && (
                      <button
                        onClick={() => handleReceive(pc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Receive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showNew && (
        <NewPurchaseModal
          products={products}
          suppliers={suppliers}
          accounts={accounts}
          onClose={() => setShowNew(false)}
          onSave={savePurchase}
        />
      )}
      {viewPurchase && (
        <ViewModal purchase={viewPurchase} onClose={() => setViewPurchase(null)} />
      )}
    </div>
  );
};
