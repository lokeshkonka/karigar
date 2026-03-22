'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Loader2, ChevronDown, ChevronRight, X, Car, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const EMPTY_FORM = { name: '', phone: '', email: '' };

export default function StaffCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*, vehicles(id, make, model, plate, color)')
      .order('created_at', { ascending: false });
    if (!error) setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleAdd = async () => {
    if (!form.name) { toast.error('Customer name required'); return; }
    setSaving(true);
    const { error } = await supabase.from('customers').insert([form]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${form.name} added!`);
    setShowModal(false);
    setForm(EMPTY_FORM);
    fetchCustomers();
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-[#1a1a1a]">Walk-in Customers</h2>
          <p className="text-sm font-bold text-gray-500">{customers.length} registered</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-electricYellow text-[#1a1a1a] font-black uppercase text-sm border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] hover:translate-y-1 transition-transform"
        >
          <Plus size={16} strokeWidth={3} /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Lookup customer by name, phone, or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow"
        />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="bg-white border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] flex flex-col transition-colors overflow-hidden">
                {/* Header Row */}
                <div 
                  className={`p-4 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer select-none hover:bg-cream ${isExpanded ? 'bg-cream' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="w-10 h-10 bg-electricYellow text-[#1a1a1a] border-2 border-[#1a1a1a] hidden md:flex items-center justify-center font-black text-lg shrink-0">
                    {c.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#1a1a1a] uppercase sm:text-lg">{c.name}</p>
                    <p className="text-xs text-gray-600 font-bold">{c.phone || 'No phone'} · {c.email || 'No email'}</p>
                  </div>
                  <div className="flex gap-4 items-center justify-between md:justify-end">
                    <span className={`text-xs font-black px-2 py-1 border-2 uppercase ${
                      c.tier === 'GOLD' ? 'border-[#1a1a1a] bg-electricYellow text-[#1a1a1a]' :
                      c.tier === 'SILVER' ? 'border-gray-400 bg-gray-200 text-gray-600' :
                      'border-orange-700 bg-orange text-white'
                    }`}>{c.tier || 'BRONZE'}</span>
                    <div className="text-gray-500">
                      {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                    </div>
                  </div>
                </div>

                {/* Expanded State (Vehicles & Scan) */}
                {isExpanded && (
                  <div className="bg-white p-4 border-t-4 border-[#1a1a1a] animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3 border-b-2 border-gray-200 pb-1">Vehicles</h4>
                    
                    {(!c.vehicles || c.vehicles.length === 0) ? (
                      <p className="text-gray-500 font-bold text-sm italic py-2">No vehicles registered yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {c.vehicles.map((v: any) => (
                          <div key={v.id} className="border-2 border-dashed border-[#1a1a1a] p-4 flex items-center justify-between bg-cream">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 border-2 border-[#1a1a1a] flex items-center justify-center shadow-[2px_2px_0_#1a1a1a]" style={{ backgroundColor: v.color || '#333' }}>
                                <Car size={20} className="text-white mix-blend-difference" />
                              </div>
                              <div>
                                <h5 className="font-black text-[#1a1a1a] uppercase leading-none">{v.make} {v.model}</h5>
                                <p className="font-mono text-gray-500 text-xs mt-1 font-bold">{v.plate}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => router.push(`/scan-intake/${v.id}?source=staff-customer`)}
                              className="bg-electricYellow border-2 border-[#1a1a1a] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] px-3 py-2 text-xs font-black uppercase flex items-center gap-2 hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                              <QrCode size={16} /> Scan
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 font-black uppercase">No customers found</div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-sm p-4">
          <div className="bg-cream border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] p-6 w-full max-w-md animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#1a1a1a] pb-2">
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Walk-in Customer</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red"><X size={22} strokeWidth={3} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Rahul Sharma' },
                { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'rahul@example.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-black uppercase text-gray-600 mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]} type={f.type} placeholder={f.placeholder}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full p-3 bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-[#1a1a1a] bg-white text-gray-600 font-black uppercase hover:bg-gray-100 shadow-[4px_4px_0_#1a1a1a]">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 py-3 bg-electricYellow text-[#1a1a1a] font-black uppercase border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] disabled:opacity-60 transition-colors">
                {saving ? 'Saving...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
