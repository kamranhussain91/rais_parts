/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from './AppContext';
import { ServiceRecord, ServiceType } from '../types';
import { 
  Wrench, 
  User, 
  Settings, 
  Activity, 
  Compass, 
  CheckCircle, 
  DollarSign, 
  Printer, 
  Calendar 
} from 'lucide-react';

export const WorkshopView: React.FC = () => {
  const { db, saveServiceRecord } = useApp();

  // Service voucher states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bikeModel, setBikeModel] = useState('CD-70');
  const [serviceType, setServiceType] = useState<ServiceType>('Bike Tuning');
  const [price, setPrice] = useState<number>(800);
  const [notes, setNotes] = useState('');

  // Active printed state
  const [activeReceipt, setActiveReceipt] = useState<ServiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!db) return <div className="p-8 text-neutral-500">Loading service sheets...</div>;

  const { services } = db;

  // Sync pricing guidelines on Service dropdown trigger
  const handleServiceChange = (type: ServiceType) => {
    setServiceType(type);
    switch (type) {
      case 'Oil Change':
        setPrice(150); // Labor charges only
        break;
      case 'Bike Tuning':
        setPrice(800);
        break;
      case 'Brake Service':
        setPrice(300);
        break;
      case 'Engine Service':
        setPrice(2500);
        break;
    }
  };

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Customer Name and active Pakistan Phone digits are required.');
      return;
    }

    const payload: ServiceRecord = {
      id: '',
      invoiceNumber: '',
      customerName,
      customerPhone,
      bikeModel,
      serviceType,
      price: Number(price),
      date: new Date().toISOString(),
      notes
    };

    const success = await saveServiceRecord(payload);
    if (success) {
      // Find the last record from services list to show print receipt
      // Since db state syncs automatically, we look for the last added one
      const tempId = 'srv_' + Date.now(); // local match estimate
      const mockRecord: ServiceRecord = {
        ...payload,
        invoiceNumber: `SRV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-NEW`,
        date: new Date().toISOString()
      };
      
      setActiveReceipt(mockRecord);
      setIsModalOpen(true);

      // Clean inputs
      setCustomerName('');
      setCustomerPhone('');
      setBikeModel('CD-70');
      setServiceType('Bike Tuning');
      setPrice(800);
      setNotes('');
    } else {
      alert('Error updating workshop service queue.');
    }
  };

  const triggerDirectPrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="workshop-view-container">
      
      {/* WORKSHOP BOOKING PORTAL FORM */}
      <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-red-600" /> 
            Service Booking
          </h2>
          <p className="text-xs text-slate-500 mt-1">Book bike maintenance and schedule oil service triggers.</p>
        </div>

        <form onSubmit={handleBookService} className="text-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Customer Name */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1.5">Customer Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Sajid Mehmood"
                className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-50/50 rounded-xl border border-slate-200 outline-hidden transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1.5">Phone Number</label>
              <input 
                type="text" 
                required
                placeholder="e.g. 03001234567"
                className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-50/50 rounded-xl border border-slate-200 font-mono outline-hidden transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            {/* Bike Model select */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1.5">Motorcycle Model</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden font-semibold transition-all focus:border-red-500 focus:bg-white text-slate-700"
                value={bikeModel}
                onChange={(e) => setBikeModel(e.target.value)}
              >
                <option value="CD-70">Honda CD-70</option>
                <option value="CD-70 Dream">Honda CD-70 Dream</option>
                <option value="Pridor">Honda Pridor (100cc)</option>
                <option value="CG-125">Honda CG-125</option>
                <option value="CG-125 Self">Honda CG-125 Self-Start</option>
                <option value="CB-150F">Honda CB-150F Sport</option>
              </select>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1.5">Service Type</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden font-semibold transition-all focus:border-red-500 focus:bg-white text-slate-700"
                value={serviceType}
                onChange={(e: any) => handleServiceChange(e.target.value)}
              >
                <option value="Bike Tuning">General Tuning</option>
                <option value="Oil Change">Engine Oil Change</option>
                <option value="Brake Service">Brake Overhaul</option>
                <option value="Engine Service">Complete Engine Service</option>
              </select>
            </div>

            {/* Service Price */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1.5">Labor Charges (Rs.)</label>
              <input 
                type="number" 
                required
                className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-50/50 rounded-xl border border-slate-200 font-mono outline-hidden font-semibold transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-slate-700"
                value={price === 0 ? '' : price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
              />
            </div>

            {/* Date block */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1.5">Booking Date</label>
              <input 
                type="text" 
                disabled
                className="w-full px-3.5 py-2 bg-slate-100 rounded-xl border border-slate-200 font-mono text-slate-400 select-none outline-hidden"
                value="Today"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-slate-500 font-semibold mb-1.5">Diagnostic Notes</label>
              <textarea 
                rows={2}
                placeholder="e.g. Adjusted engine tappets, replaced rear brake shoes..."
                className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-50/50 rounded-xl border border-slate-200 outline-hidden resize-none transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold font-sans shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <CheckCircle className="w-4 h-4" /> Book Service & Print Slip
          </button>
        </form>
      </div>

      {/* RECENT WORKSHOP TICKETS HISTORY TABLES */}
      <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" /> Service Queue
            </h2>
            <p className="text-xs text-slate-550 text-slate-500 mt-1">Ongoing repair list</p>
          </div>

          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 text-xs">
            {services.map(srv => {
              const dateVal = new Date(srv.date);
              const isOil = srv.serviceType === 'Oil Change';
              return (
                <div key={srv.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:border-red-400 hover:shadow-2xs select-none transition-all duration-200 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 font-mono text-[11px] bg-slate-200/60 px-1.5 py-0.5 rounded">{srv.invoiceNumber}</span>
                      <span className="text-xxs text-slate-400">•</span>
                      <span className="text-xxs text-slate-400 font-mono">{dateVal.toLocaleDateString()}</span>
                    </div>
                    <strong className="text-slate-900 block text-xs mt-1.5 font-bold">{srv.customerName}</strong>
                    <div className="flex flex-wrap items-center gap-2 text-xxs font-mono text-slate-400 mt-1">
                      <span>Bike: <strong className="text-slate-600 font-medium">{srv.bikeModel || 'CD-70'}</strong></span>
                      <span>|</span>
                      <span>Phone: <strong className="text-slate-600 font-medium">{srv.customerPhone}</strong></span>
                    </div>
                    {srv.notes && (
                      <p className="text-xxs italic text-slate-400 mt-1 border-l border-slate-200 pl-1">"{srv.notes}"</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xxs font-bold uppercase tracking-wider border border-red-100">
                      {srv.serviceType}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 leading-none">
                      Rs.{srv.price}
                    </span>
                    {isOil && (
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${srv.reminderStatus === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : srv.reminderStatus === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200 animate-pulse'}`}>
                        Remind: {srv.reminderStatus}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {services.length === 0 && (
              <div className="py-16 text-center text-slate-400">No bike workshop services registered yet today.</div>
            )}
          </div>
        </div>
      </div>

      {/* REPRINT SLIP VIEW MODAL */}
      {isModalOpen && activeReceipt && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-neutral-100 flex flex-col">
            
            {/* Modal headers */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <Printer className="w-3.5 h-3.5 text-neutral-500" />
                Workshop Job Receipt Print Out
              </span>
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 bg-red-600 text-white rounded text-xxs font-bold cursor-pointer hover:bg-red-700 flex items-center gap-0.5"
                  onClick={triggerDirectPrint}
                >
                  <Printer className="w-3 h-3" /> Print
                </button>
                <button 
                  className="px-2.5 py-1 bg-neutral-200 text-neutral-700 rounded text-xxs font-bold cursor-pointer hover:bg-neutral-300"
                  onClick={() => {
                    setIsModalOpen(false);
                    setActiveReceipt(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* THERMAL SLIP INPRINTING FRAME */}
            <div className="p-6 bg-white font-mono text-[11px] leading-relaxed text-neutral-800 print-area shadow-inner">
              <div className="text-center font-bold">
                <h3 className="text-sm uppercase tracking-wider">RAIS MOTOR WORKSHOP</h3>
                <p className="text-xxs text-neutral-500 font-sans mt-0.5">Allama Iqbal Road, Dharampura, Lahore</p>
                <p className="text-xxs text-neutral-500 font-sans">Mob: 0321-4567812 | Certified Technicians</p>
                <div className="border-b border-dashed border-neutral-300 my-2.5" />
              </div>

              <div className="space-y-1 text-neutral-700 text-xxs">
                <div className="flex justify-between">
                  <span>Job Ticket:</span>
                  <span className="font-bold text-neutral-800">{activeReceipt.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Booking Date:</span>
                  <span>{new Date(activeReceipt.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Client Driver:</span>
                  <span className="font-bold text-neutral-800">{activeReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone Number:</span>
                  <span className="font-bold">{activeReceipt.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bike Match:</span>
                  <span>Honda {activeReceipt.bikeModel}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-neutral-300 my-2.5" />

              {/* Maintenance summary line description */}
              <div className="space-y-2 text-xxs">
                <div className="flex justify-between font-bold text-neutral-700 uppercase">
                  <span>Service Job Undertaken</span>
                  <span>Charges (Rs.)</span>
                </div>
                <div className="flex justify-between bg-neutral-50 p-2.5 rounded border border-neutral-100">
                  <div>
                    <strong className="block text-neutral-800">{activeReceipt.serviceType}</strong>
                    {activeReceipt.notes ? (
                      <span className="text-[10px] text-neutral-400 block italic leading-tight mt-0.5">"{activeReceipt.notes}"</span>
                    ) : (
                      <span className="text-[10px] text-neutral-400 block leading-tight mt-0.5">Standard check list diagnostics complete.</span>
                    )}
                  </div>
                  <strong className="font-mono text-neutral-800 shrink-0">Rs.{activeReceipt.price}</strong>
                </div>
              </div>

              {/* Reminders section in receipt */}
              {activeReceipt.serviceType === 'Oil Change' && (
                <div className="my-3 p-2 border border-red-100 bg-red-50/40 rounded text-xxs text-neutral-600 block text-center leading-tight">
                  <span className="block font-bold text-red-600">⚠️ OIL REFILL CYCLE ENGAGED</span>
                  Our system scheduled automated oil change SMS reminder alerts 30 days later: 
                  <strong className="block text-neutral-800 mt-1 font-mono">Next Due: {new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString()}</strong>
                </div>
              )}

              <div className="border-b border-dashed border-neutral-300 my-3.5" />

              <div className="text-center text-neutral-600 text-xxs leading-tight">
                <p className="font-bold text-black uppercase">🌟 Workshop Quality Assured 🌟</p>
                <p className="text-neutral-400 text-[10px] mt-1 font-sans">Always check engine oil level every 1000 KMs. Drive safely!</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
