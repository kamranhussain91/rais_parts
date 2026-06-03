import React, { useState, useMemo } from 'react';
import { useApp } from './AppContext';
import { ServiceRecord, ServiceType } from '../types';
import {
  Wrench, Plus, X, Printer, Search, CheckCircle,
  AlertCircle, DollarSign, Bike
} from 'lucide-react';

const SERVICE_PRICES: Record<ServiceType, number> = {
  'Oil Change':     150,
  'Bike Tuning':    800,
  'Brake Service':  300,
  'Engine Service': 2500,
};

const BIKE_MODELS = [
  'CD-70', 'CD-70 Dream', 'Pridor', 'CG-125', 'CG-125 Self', 'CB-150F',
];

// ─── Print Receipt Modal ──────────────────────────────────────────────────────
const ReceiptModal: React.FC<{ record: ServiceRecord; onClose: () => void }> = ({ record, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50 no-print">
        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Printer className="w-4 h-4 text-slate-500" /> Workshop Job Receipt
        </span>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1">
            <Printer className="w-3 h-3" /> Print
          </button>
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer">
            Close
          </button>
        </div>
      </div>

      <div className="p-6 font-mono text-[11px] leading-relaxed text-neutral-800 print-area">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider">RAIS MOTOR WORKSHOP</p>
          <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Allama Iqbal Road, Dharampura, Lahore</p>
          <p className="text-[10px] text-neutral-500 font-sans">Mob: 0321-4567812 | Certified Technicians</p>
          <div className="border-b border-dashed border-neutral-300 my-3" />
        </div>

        <div className="space-y-1.5 text-[11px]">
          {[
            ['Job Ticket',    record.invoiceNumber],
            ['Date',          new Date(record.date).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' })],
            ['Customer',      record.customerName],
            ['Phone',         record.customerPhone],
            ['Bike Model',    `Honda ${record.bikeModel}`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <span className="text-neutral-500">{label}:</span>
              <span className="font-bold text-neutral-800 text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed border-neutral-300 my-3" />

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase text-neutral-500">
            <span>Service</span><span>Charges</span>
          </div>
          <div className="flex justify-between bg-neutral-50 p-2.5 rounded border border-neutral-100">
            <div>
              <strong className="text-neutral-800 block">{record.serviceType}</strong>
              {record.notes
                ? <span className="text-[10px] text-neutral-400 italic">"{record.notes}"</span>
                : <span className="text-[10px] text-neutral-400">Standard diagnostics complete.</span>
              }
            </div>
            <strong className="shrink-0 font-mono">Rs. {record.price}</strong>
          </div>
        </div>

        {record.serviceType === 'Oil Change' && (
          <div className="mt-3 p-2.5 border border-red-200 bg-red-50/60 rounded text-center">
            <p className="font-bold text-red-600 text-[10px]">⚠ OIL CHANGE REMINDER SCHEDULED</p>
            <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
              Next Due: <strong className="text-neutral-800">
                {new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' })}
              </strong>
            </p>
          </div>
        )}

        <div className="border-b border-dashed border-neutral-300 my-3" />
        <p className="text-center text-[10px] font-bold uppercase text-neutral-700">Thank you for choosing Rais Honda!</p>
        <p className="text-center text-[10px] text-neutral-400 font-sans mt-0.5">Check engine oil every 1000 km. Drive safely.</p>
      </div>
    </div>
  </div>
);

// ─── New Service Modal ────────────────────────────────────────────────────────
interface NewServiceModalProps {
  onClose: () => void;
  onSave: (record: ServiceRecord) => Promise<boolean>;
  onBooked: (record: ServiceRecord) => void;
}

const NewServiceModal: React.FC<NewServiceModalProps> = ({ onClose, onSave, onBooked }) => {
  const [customerName,  setName]    = useState('');
  const [customerPhone, setPhone]   = useState('');
  const [bikeModel,     setBike]    = useState('CD-70');
  const [serviceType,   setService] = useState<ServiceType>('Bike Tuning');
  const [price,         setPrice]   = useState(800);
  const [notes,         setNotes]   = useState('');
  const [saving,        setSaving]  = useState(false);

  const handleServiceChange = (type: ServiceType) => {
    setService(type);
    setPrice(SERVICE_PRICES[type]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return alert('Customer name is required.');
    if (!customerPhone.trim()) return alert('Phone number is required.');
    setSaving(true);
    const payload: ServiceRecord = {
      id: '', invoiceNumber: '',
      customerName: customerName.trim(), customerPhone: customerPhone.trim(),
      bikeModel, serviceType, price: Number(price),
      date: new Date().toISOString(), notes: notes.trim(),
    };
    const ok = await onSave(payload);
    setSaving(false);
    if (ok) {
      onBooked({ ...payload, invoiceNumber: `SRV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-NEW` });
      onClose();
    } else {
      alert('Failed to save service record. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">New Service Booking</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Name <span className="text-red-500">*</span></label>
              <input
                type="text" value={customerName} onChange={e => setName(e.target.value)}
                placeholder="e.g. Sajid Mehmood"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone <span className="text-red-500">*</span></label>
              <input
                type="text" value={customerPhone} onChange={e => setPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bike Model</label>
              <select
                value={bikeModel} onChange={e => setBike(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-red-400 bg-white cursor-pointer"
              >
                {BIKE_MODELS.map(m => <option key={m} value={m}>Honda {m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Service Type</label>
              <select
                value={serviceType} onChange={e => handleServiceChange(e.target.value as ServiceType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-red-400 bg-white cursor-pointer"
              >
                <option value="Bike Tuning">General Tuning</option>
                <option value="Oil Change">Engine Oil Change</option>
                <option value="Brake Service">Brake Overhaul</option>
                <option value="Engine Service">Complete Engine Service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Labor Charges (Rs.)</label>
              <input
                type="number" min="0" value={price || ''} onChange={e => setPrice(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Diagnostic Notes</label>
              <textarea
                rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Adjusted tappets, replaced rear brake shoes..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none resize-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
              />
            </div>
          </div>

          {serviceType === 'Oil Change' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>An oil change reminder will be automatically scheduled 30 days from today.</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Saving...' : 'Book & Print Slip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main WorkshopView ────────────────────────────────────────────────────────
export const WorkshopView: React.FC = () => {
  const { db, saveServiceRecord } = useApp();

  const [search,      setSearch]    = useState('');
  const [filterType,  setFilterType] = useState<ServiceType | 'all'>('all');
  const [showNew,     setShowNew]   = useState(false);
  const [receipt,     setReceipt]   = useState<ServiceRecord | null>(null);

  if (!db) return <div className="p-8 text-slate-400 text-sm">Loading workshop...</div>;

  const { services } = db;

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalRevenue   = services.reduce((s, r) => s + r.price, 0);
  const oilChanges     = services.filter(r => r.serviceType === 'Oil Change').length;
  const pendingReminders = services.filter(r => r.serviceType === 'Oil Change' && r.reminderStatus === 'Pending').length;

  // ─── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    services.filter(r => {
      const matchSearch = !search || (r.customerName + r.customerPhone + r.bikeModel + r.invoiceNumber).toLowerCase().includes(search.toLowerCase());
      const matchType   = filterType === 'all' || r.serviceType === filterType;
      return matchSearch && matchType;
    }),
    [services, search, filterType]
  );

  // Badge colors per service type
  const typeBadge = (type: ServiceType) => {
    const map: Record<ServiceType, string> = {
      'Oil Change':     'bg-amber-100 text-amber-700',
      'Bike Tuning':    'bg-blue-100 text-blue-700',
      'Brake Service':  'bg-orange-100 text-orange-700',
      'Engine Service': 'bg-red-100 text-red-700',
    };
    return map[type] ?? 'bg-slate-100 text-slate-600';
  };

  const reminderBadge = (status?: string) => {
    if (!status) return null;
    const map: Record<string, string> = {
      'Pending':   'bg-red-100 text-red-700',
      'Sent':      'bg-blue-100 text-blue-700',
      'Confirmed': 'bg-emerald-100 text-emerald-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">Manage service tickets and oil change reminders</p>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Service
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold">Total Services</p>
            <p className="text-2xl font-bold text-slate-800">{services.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold">Workshop Revenue</p>
            <p className="text-lg font-bold text-slate-800 font-mono">Rs. {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold">Oil Reminders Pending</p>
            <p className="text-2xl font-bold text-slate-800">{pendingReminders}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, ticket..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 shadow-sm w-64"
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden text-xs font-semibold">
          {(['all', 'Oil Change', 'Bike Tuning', 'Brake Service', 'Engine Service'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 transition-colors cursor-pointer whitespace-nowrap ${filterType === t ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticket</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bike</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service</th>
              <th className="px-5 py-3.5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Price</th>
              <th className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reminder</th>
              <th className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400 text-sm">
                  {search || filterType !== 'all'
                    ? 'No service records match your filters.'
                    : 'No service records yet. Click "+ New Service" to get started.'}
                </td>
              </tr>
            )}
            {filtered.map(srv => (
              <tr key={srv.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-3.5">
                  <span className="text-xs font-bold font-mono text-red-600">{srv.invoiceNumber}</span>
                </td>
                <td className="px-5 py-3.5 text-xs font-mono text-slate-500 whitespace-nowrap">
                  {new Date(srv.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-xs font-bold text-slate-800">{srv.customerName}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{srv.customerPhone}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                    <Bike className="w-3 h-3" />{srv.bikeModel || 'CD-70'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${typeBadge(srv.serviceType)}`}>
                    {srv.serviceType}
                  </span>
                  {srv.notes && (
                    <p className="text-[10px] text-slate-400 italic mt-1 max-w-[160px] truncate" title={srv.notes}>
                      {srv.notes}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-bold font-mono text-slate-800">
                  Rs. {srv.price.toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-center">
                  {srv.serviceType === 'Oil Change' && srv.reminderStatus ? (
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${reminderBadge(srv.reminderStatus)}`}>
                      {srv.reminderStatus}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => setReceipt(srv)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all cursor-pointer mx-auto"
                    title="Print receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showNew && (
        <NewServiceModal
          onClose={() => setShowNew(false)}
          onSave={saveServiceRecord}
          onBooked={r => setReceipt(r)}
        />
      )}
      {receipt && (
        <ReceiptModal record={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
};
