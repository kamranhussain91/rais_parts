/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from './AppContext';
import { 
  Building, 
  CreditCard, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  Coins, 
  CheckCircle 
} from 'lucide-react';

export const BankingView: React.FC = () => {
  const { db, saveBankTransaction } = useApp();

  // Active form adjustment states
  const [targetAccountId, setTargetAccountId] = useState('bank_1');
  const [type, setType] = useState<'Credit' | 'Debit'>('Credit');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);

  if (!db) return <div className="p-8 text-neutral-500">Loading bank vaults...</div>;

  const { accounts, ledger } = db;

  const handleManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) {
      alert('Manual adjustments require positive amounts and descriptive justifications.');
      return;
    }

    const success = await saveBankTransaction(targetAccountId, type, Number(amount), description.trim());
    if (success) {
      setAmount(0);
      setDescription('');
    } else {
      alert('Core accounting transaction rejected by banking server.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="banking-view-container flex flex-col">
      
      {/* MANUAL LEDGER ADJUSTMENT FORM CARD */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-red-600" /> Manual Account adjustment
          </h2>
          <p className="text-xs text-slate-400 mt-1">Logs cash deposits, banking wires, or manual capital adjustments</p>
        </div>

        <form onSubmit={handleManualTransaction} className="text-xs space-y-4">
          
          {/* Target account select */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Select Target Account Vault</label>
            <select 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden font-bold transition-all focus:bg-white focus:border-red-500"
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.bankName} - Rs.{acc.balance.toLocaleString()}</option>
              ))}
            </select>
          </div>

          {/* Type trigger Credit/Debit */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Transaction Direction Type</label>
            <div className="grid grid-cols-2 gap-2 text-center font-bold">
              <button 
                type="button"
                className={`py-2 px-3 border rounded-xl font-bold uppercase tracking-wider text-xxs transition-all cursor-pointer ${type === 'Credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-emerald-600'}`}
                onClick={() => setType('Credit')}
              >
                Deposit (Credit +)
              </button>
              <button 
                type="button"
                className={`py-2 px-3 border rounded-xl font-bold uppercase tracking-wider text-xxs transition-all cursor-pointer ${type === 'Debit' ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600'}`}
                onClick={() => setType('Debit')}
              >
                Withdraw (Debit -)
              </button>
            </div>
          </div>

          {/* Amount parameter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Transaction Sum Amount (Rs.)</label>
            <input 
              type="number" 
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/50 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 outline-hidden transition-all duration-205 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
              value={amount === 0 ? '' : amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            />
          </div>

          {/* description text justifications */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Voucher Justification Description</label>
            <textarea 
              rows={3}
              required
              placeholder="e.g. Cleared pending supplier dues manually..."
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/50 rounded-xl border border-slate-200 outline-hidden resize-none transition-all duration-205 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold font-sans shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <CheckCircle className="w-4 h-4" /> Finalize Adjustment Entries
          </button>
        </form>
      </div>

      {/* CHRONOLOGICAL AUDIT LEDGER & ACCOUNTS SUMMARY SPLIT */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        
        {/* Accounts bar */}
        <div>
          <h2 className="text-xs font-black uppercase text-slate-850 tracking-wider flex items-center flex-wrap justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-800"><Building className="w-4 h-4 text-slate-600" /> Multi-Account Balances</span>
            <span className="text-xs font-mono font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
              Vault Total: Rs.{accounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 select-none">
            {accounts.map(acc => {
              return (
                <div key={acc.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-red-50/10 hover:border-red-200 transition-all duration-200 flex flex-col justify-between h-24">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block truncate leading-tight">{acc.bankName}</span>
                    <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5 truncate">{acc.accountNumber}</span>
                  </div>
                  <strong className="text-sm font-extrabold font-mono text-slate-900 block mt-2">Rs.{acc.balance.toLocaleString()}</strong>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Ledger logs */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xs font-black uppercase text-slate-850 tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" /> Unified Accounting Ledger sheets
            </h2>
            <p className="text-xs text-slate-400 mt-1">Dual-entry chronological logs of credit/debit movements across all coffers</p>
          </div>

          <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
            {ledger.map(entry => {
              const isCredit = entry.type === 'Credit';
              const isSelected = selectedLedgerId === entry.id;
              return (
                <div 
                  key={entry.id} 
                  onClick={() => setSelectedLedgerId(entry.id)}
                  className={`p-4 rounded-xl border cursor-pointer select-none transition-all duration-200 flex items-center justify-between gap-4 ${
                    isSelected 
                      ? 'bg-red-600 border-red-700 text-white shadow-md scale-[1.01]' 
                      : 'bg-white border-slate-200 hover:border-red-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-black uppercase tracking-tight text-xs ${isSelected ? 'text-white' : 'text-slate-800'}`}>{entry.bankName}</span>
                      <span className={`text-xxs ${isSelected ? 'text-red-300' : 'text-slate-400'}`}>•</span>
                      <span className={`text-xxs font-mono ${isSelected ? 'text-red-200' : 'text-slate-400'}`}>{new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    <p className={`text-xxs mt-1 line-clamp-1 italic ${isSelected ? 'text-red-100' : 'text-slate-500'}`}>{entry.description}</p>
                    <span className={`text-[9.5px] font-mono block mt-1 ${isSelected ? 'text-red-200 font-semibold' : 'text-slate-400'}`}>Bal After: Rs.{entry.balanceAfter.toLocaleString()}</span>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className={`text-[11px] font-mono font-black px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border uppercase tracking-wider ${
                      isSelected 
                        ? 'bg-white/10 text-white border-white/20' 
                        : isCredit 
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                          : 'text-rose-700 bg-rose-50 border-rose-100'
                    }`}>
                      {isCredit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      Rs.{entry.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
            {ledger.length === 0 && (
              <div className="py-16 text-center text-slate-400 select-none">No transactions recorded yet in ledger.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
