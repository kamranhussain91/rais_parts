/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Customer } from '../types';
import { 
  Users, 
  Search, 
  MapPin, 
  Phone, 
  Calendar, 
  Wrench, 
  ShoppingBag, 
  TrendingUp, 
  ClipboardList 
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { db } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  if (!db) return <div className="p-8 text-neutral-500">Loading directory...</div>;

  const { customers, invoices, services } = db;

  // Filter customers based on search filter
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.bikeModel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selected customer object
  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // If there are customers, set the first default selected if null
  if (!selectedCustomerId && customers.length > 0) {
    setSelectedCustomerId(customers[0].id);
  }

  // Pre-load dynamic timeline events for active customer
  const getTimelineEvents = () => {
    if (!activeCustomer) return [];

    const normalizedPhone = activeCustomer.phone.trim();

    // 1. Find Sale Invoices
    const clientInvoices = invoices.filter(inv => 
      inv.customerId === activeCustomer.id || 
      inv.customerPhone.trim() === normalizedPhone
    ).map(inv => ({
      id: inv.id,
      date: inv.date,
      type: 'Purchase',
      title: 'Parts Purchase Receipt',
      number: inv.invoiceNumber,
      amount: inv.finalAmount,
      details: `${inv.items.length} items: ` + inv.items.map(i => `${i.name} (QTY:${i.qty})`).join(', ')
    }));

    // 2. Find Workshop Services
    const clientServices = services.filter(srv => 
      srv.customerPhone.trim() === normalizedPhone
    ).map(srv => ({
      id: srv.id,
      date: srv.date,
      type: 'Service',
      title: `Workshop Job - ${srv.serviceType}`,
      number: srv.invoiceNumber,
      amount: srv.price,
      details: srv.notes || 'Routine checkup completed successfully.'
    }));

    // Merge & Sort chronological
    return [...clientInvoices, ...clientServices].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const timelineEvents = getTimelineEvents();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="customers-view-container">
      
      {/* LEFT DIRECTORY COLUMN (Search & List) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-red-600" /> Customers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Directory of registered clients</p>
        </div>

        {/* Search Input bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone, or bike..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:bg-white focus:border-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Directory listing flow clickers */}
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {filteredCustomers.map(c => {
            const isSelected = selectedCustomerId === c.id;
            return (
              <div 
                key={c.id} 
                className={`p-4 border cursor-pointer transition-all duration-200 rounded-xl shadow-xs select-none ${
                  isSelected 
                    ? 'bg-red-600 border-red-700 text-white shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/20 text-slate-700'
                }`}
                onClick={() => setSelectedCustomerId(c.id)}
                id={`customer-card-${c.id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className={`font-semibold block text-sm transition-colors ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {c.name}
                    </span>
                    <span className={`text-xxs font-mono flex items-center gap-1 transition-colors ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                      <Phone className="w-3.5 h-3.5 shrink-0" /> {c.phone}
                    </span>
                  </div>
                  
                  <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded tracking-wider shrink-0 transition-colors ${
                    isSelected ? 'bg-white/15 text-white border border-white/10' : 'bg-slate-50 border border-slate-200 text-slate-600'
                  }`}>
                    {c.bikeModel || 'CD-70'}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredCustomers.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">No registered customers found.</div>
          )}
        </div>
      </div>

      {/* RIGHT CHRONOLOGICAL TIMELINE AREA */}
      <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-neutral-100 shadow-xs space-y-5">
        {activeCustomer ? (
          <>
            {/* Header info */}
            <div className="border-b border-neutral-100 pb-4">
              <span className="text-xxs font-semibold text-neutral-405 text-slate-400 uppercase tracking-widest block font-sans">Profile Overview</span>
              <h2 className="text-xl font-bold text-neutral-800 mt-1">{activeCustomer.name}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3.5 text-xxs font-normal text-neutral-500">
                <div className="flex items-center gap-1.5 p-2 bg-neutral-50 rounded border border-neutral-100">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">Phone: {activeCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-neutral-50 rounded border border-neutral-100">
                  <ClipboardList className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">Bike: {activeCustomer.bikeModel || 'CD-70'}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-neutral-50 rounded border border-neutral-100">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate" title={activeCustomer.address}>Address: {activeCustomer.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Timeline flows */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-sans">Activity History</h3>
              
              <div className="relative border-l border-neutral-200 pl-5 ml-2.5 space-y-5 max-h-[360px] overflow-y-auto pr-1 pt-1.5">
                {timelineEvents.map((ev, idx) => {
                  const dateVal = new Date(ev.date);
                  const isPurchase = ev.type === 'Purchase';
                  return (
                    <div key={idx} className="relative text-xs">
                      {/* Left icon marker */}
                      <span className={`absolute -left-[29px] top-0.5 p-1 rounded-full border ${isPurchase ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {isPurchase ? <ShoppingBag className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                      </span>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pr-2">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-neutral-800 text-xs">{ev.title}</h4>
                            <span className="text-xxs font-mono text-neutral-400">({ev.number})</span>
                          </div>
                          <span className="font-mono text-xxs bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500 flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3" /> {dateVal.toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xxs text-neutral-500 leading-normal max-w-sm mr-2">{ev.details}</p>
                        
                        <div className="text-[10px] font-bold text-neutral-700">
                          Total: <strong className="font-mono text-neutral-850 font-bold">Rs.{ev.amount}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {timelineEvents.length === 0 && (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    No transactions on record for this customer.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-24 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
            <Users className="w-12 h-12 text-neutral-200" />
            Please add or select a customer profile first to slide timelines.
          </div>
        )}
      </div>

    </div>
  );
};
