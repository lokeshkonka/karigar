'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Filter, Phone, Mail, MoreHorizontal, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  async function loadCustomers() {
    setLoading(true);
    // Fetch customers with their vehicles and invoices
    const { data, error } = await supabase
      .from('customers')
      .select(`id, name, phone, email, tier, vehicles ( id ), invoices ( amount )`);
      
    if (!error && data) {
      setCustomers(data.map((c: any) => {
        const spent = c.invoices ? c.invoices.reduce((acc: number, inv: any) => acc + (Number(inv.amount) || 0), 0) : 0;
        return {
          id: c.id.toString(),
          name: c.name,
          phone: c.phone || 'N/A',
          email: c.email || 'N/A',
          vehicles: c.vehicles ? c.vehicles.length : 0,
          spent: spent,
          lastVisit: 'Recent',
          tier: c.tier || 'BRONZE'
        };
      }));
    }
    setLoading(false);
  }

  useEffect(() => { loadCustomers(); }, []);

  const handleAddCustomer = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('customers').insert([{
       name: form.name,
       phone: form.phone,
       email: form.email,
       tier: 'BRONZE'
    }]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Customer added');
    setShowModal(false);
    setForm({ name: '', phone: '', email: '' });
    loadCustomers();
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Name,Phone,Email,Tier,Vehicles,Spent\n"
        + filtered.map(c => `${c.name},${c.phone},${c.email},${c.tier},${c.vehicles},${c.spent}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "garageos_customers.csv");
    document.body.appendChild(link);
    link.click();
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    gold: customers.filter(c => c.tier === 'GOLD').length,
    silver: customers.filter(c => c.tier === 'SILVER').length,
    bronze: customers.filter(c => c.tier === 'BRONZE').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">Customer CRM</h1>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus size={18} strokeWidth={3} /> Add Customer
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 relative">
        <div className="flex-1 max-w-lg">
          <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a] mb-1 block">Search CRM</label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border-neo focus:outline-none focus:ring-2 focus:ring-electricYellow" 
              placeholder="Search by Name, Phone, or Email..."
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" onClick={exportCSV} className="flex items-center gap-2 py-3 bg-white">
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden shadow-[6px_6px_0px_#1a1a1a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1a1a1a] text-white">
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a] w-16 text-center">PIC</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Customer</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Contact</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a] text-center">Vehicles</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a] text-right">Lifetime Spend</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8"><Loader text="Loading Customers..." /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center font-bold text-gray-500 uppercase tracking-widest">No customers found.</td></tr>
              ) : filtered.map((cust, i) => (
                <tr key={cust.id} className={`border-2 border-[#1a1a1a] font-bold hover:bg-electricYellow/10 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-cream'}`}>
                  <td className="p-4 border-r-2 border-[#1a1a1a] text-center">
                    <div className="w-10 h-10 border-neo-sm bg-electricYellow mx-auto flex items-center justify-center font-black text-lg">
                      {cust.name.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-black text-lg uppercase tracking-wide">{cust.name}</span>
                      <Badge className={
                        cust.tier === 'GOLD' ? 'bg-electricYellow text-[#1a1a1a]' : 
                        cust.tier === 'SILVER' ? 'bg-gray-300 text-[#1a1a1a]' : 
                        'bg-orange text-white'
                      }>{cust.tier} MEMBER</Badge>
                    </div>
                  </td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">
                    <div className="flex flex-col gap-1 text-sm font-bold">
                      <a href={`tel:${cust.phone}`} className="flex items-center gap-1 hover:text-blue"><Phone size={14} /> {cust.phone}</a>
                      <a href={`mailto:${cust.email}`} className="flex items-center gap-1 hover:text-blue"><Mail size={14} /> {cust.email}</a>
                    </div>
                  </td>
                  <td className="p-4 border-r-2 border-[#1a1a1a] text-center">
                    <span className="text-xl font-black font-mono">{cust.vehicles}</span>
                  </td>
                  <td className="p-4 border-r-2 border-[#1a1a1a] text-right font-black text-lg text-green whitespace-nowrap">
                    ₹ {cust.spent.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <Button variant="outline" className="px-3 py-1 bg-white hover:bg-cream">
                      <MoreHorizontal size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Loyalty Insights Preview (Now Real Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 mt-6 border-t-4 border-[#1a1a1a] border-dashed">
         <Card className="bg-electricYellow text-[#1a1a1a]">
            <h3 className="font-black tracking-widest uppercase mb-2 border-b-2 border-[#1a1a1a] inline-block pb-1">Gold Members</h3>
            <p className="text-5xl font-black mt-2">{stats.gold}</p>
         </Card>
         <Card className="bg-gray-300 text-[#1a1a1a]">
            <h3 className="font-black tracking-widest uppercase mb-2 border-b-2 border-[#1a1a1a] inline-block pb-1">Silver Members</h3>
            <p className="text-5xl font-black mt-2">{stats.silver}</p>
         </Card>
         <Card className="bg-orange text-white border-white shadow-[4px_4px_0px_#ffffff]">
            <h3 className="font-black tracking-widest uppercase mb-2 border-b-2 border-white inline-block pb-1">Bronze Members</h3>
            <p className="text-5xl font-black mt-2">{stats.bronze}</p>
         </Card>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-cream p-6 border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black uppercase tracking-widest">New Customer</h2>
               <button onClick={() => setShowModal(false)}><X className="text-gray-500 hover:text-red transition-colors"/></button>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-black uppercase mb-1 tracking-wider">Full Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full border-2 border-[#1a1a1a] p-3 font-bold focus:ring-2 focus:ring-electricYellow outline-none" />
               </div>
               <div>
                  <label className="block text-xs font-black uppercase mb-1 tracking-wider">Phone Number</label>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full border-2 border-[#1a1a1a] p-3 font-bold focus:ring-2 focus:ring-electricYellow outline-none" />
               </div>
               <div>
                  <label className="block text-xs font-black uppercase mb-1 tracking-wider">Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full border-2 border-[#1a1a1a] p-3 font-bold focus:ring-2 focus:ring-electricYellow outline-none" />
               </div>
               <div className="flex gap-4 pt-4">
                 <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 bg-white">Cancel</Button>
                 <Button onClick={handleAddCustomer} disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Customer'}</Button>
               </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
