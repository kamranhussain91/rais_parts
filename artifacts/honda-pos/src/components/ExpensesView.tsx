/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from './AppContext';
import { ExpenseCategory, Expense } from '../types';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle,
  FileText,
  Briefcase
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { db, saveExpense, currentUser } = useApp();

  const [category, setCategory] = useState<ExpenseCategory>('Electricity');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  if (!db) return <div className="p-8 text-neutral-500">Loading ledger...</div>;

  const { expenses } = db;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) {
      alert('Operational expenses require positive amounts and descriptive justifications.');
      return;
    }

    const payload: Expense = {
      id: '',
      date: new Date().toISOString(),
      category,
      amount: Number(amount),
      description: description.trim()
    };

    const success = await saveExpense(payload);
    if (success) {
      setAmount(0);
      setDescription('');
    } else {
      alert('Failed to log expense.');
    }
  };

  // Aggregated totals
  const todayStr = '2026-06-01';
  const monthStr = '2026-06';

  const expensesToday = expenses
    .filter(e => e.date.startsWith(todayStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const expensesMonth = expenses
    .filter(e => e.date.startsWith(monthStr))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="expenses-view-container">
      
      {/* EXPENSE INVOICE ENTRY BOX */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-red-600" /> 
            Operational Expense Entry
          </h2>
          <p className="text-xs text-slate-400 mt-1">Logs utilities and marketing costs paid directly from the cash drawer</p>
        </div>

        <form onSubmit={handleSubmit} className="text-xs space-y-4">
          
          {/* Category SELECT */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Financial Cost Center Group</label>
            <select 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden font-bold transition-all focus:bg-white focus:border-red-500"
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
            >
              <option value="Electricity">Electricity Utility Bills</option>
              <option value="Rent">Shop Tenant Rent</option>
              <option value="Salary">Workshop Mechanics Salaries</option>
              <option value="Marketing">Customer Promo Flyer/Ads</option>
              <option value="Miscellaneous">Tea, Refreshments & Guests</option>
            </select>
          </div>

          {/* Amount parameter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Debit Cash Amount (Rs.)</label>
            <input 
              type="number" 
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/50 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 outline-hidden transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
              value={amount === 0 ? '' : amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            />
          </div>

          {/* description note justifications */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Voucher Description Note</label>
            <textarea 
              rows={3}
              required
              placeholder="Paid tea refreshments for mechanisation lobby..."
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/50 rounded-xl border border-slate-200 outline-hidden resize-none transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Sums overview */}
          <div className="p-4 bg-rose-50/30 rounded-xl border border-rose-100 text-xs text-slate-500 space-y-1.5 select-none">
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>Cost Outflows (Today):</span>
              <strong className="text-red-600 font-mono text-xs font-black">Rs.{expensesToday.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between items-center border-t border-rose-100/55 pt-1.5 mt-1.5 text-slate-600 font-medium">
              <span>Cost Outflows (Month):</span>
              <strong className="text-red-600 font-mono text-xs font-black">Rs.{expensesMonth.toLocaleString()}</strong>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold font-sans shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <CheckCircle className="w-4 h-4" /> Save Expense record
          </button>
        </form>
      </div>

      {/* DYNAMIC LIST OF EXPENSES INJECTED FROM FILE */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-600" /> Expense Statement Ledgers
          </h2>
          <p className="text-xs text-slate-400 mt-1">Chronological audit ledger of all expenses deducted from shop funds</p>
        </div>

        <div className="space-y-3 max-h-[510px] overflow-y-auto pr-1">
          {expenses.length > 0 ? (
            expenses.map(exp => {
              const isSelected = selectedExpenseId === exp.id;
              return (
                <div 
                  key={exp.id} 
                  onClick={() => setSelectedExpenseId(exp.id)}
                  className={`p-4 rounded-xl border cursor-pointer select-none transition-all duration-200 flex flex-col gap-2.5 ${
                    isSelected 
                      ? 'bg-red-600 border-red-700 text-white shadow-md scale-[1.01]' 
                      : 'bg-white border-slate-200 hover:border-red-300 hover:bg-slate-50/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className={`inline-block px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider block border ${
                        isSelected 
                          ? 'bg-white/10 text-white border-white/20' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {exp.category}
                      </span>
                      <span className={`text-[10px] font-mono font-medium ${
                        isSelected ? 'text-red-200' : 'text-slate-400'
                      }`}>
                        {new Date(exp.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`font-mono text-sm font-black ${
                      isSelected ? 'text-white' : 'text-red-600'
                    }`}>
                      Rs.{exp.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-xs text-left font-semibold ${
                    isSelected ? 'text-red-50' : 'text-slate-700'
                  }`}>
                    {exp.description}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-slate-400">No shop expenses logged yet in DB.</div>
          )}
        </div>
      </div>

    </div>
  );
};
