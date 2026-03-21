'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, X, Users, Activity, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  hourly_rate: number;
  bay_number: string;
  status: string;
  user_id: string | null;
}

const EMPTY_FORM = { name: '', email: '', role: 'TECHNICIAN', hourly_rate: 300, bay_number: 'Bay 01' };

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load staff');
    else setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAddStaff = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    setSaving(true);
    const { error } = await supabase.from('staff_profiles').insert([form]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${form.name} added! They can now log in with ${form.email}`);
    setShowModal(false);
    setForm(EMPTY_FORM);
    fetchStaff();
  };

  const handleRemove = async (id: string, name: string) => {
    const { error } = await supabase.from('staff_profiles').delete().eq('id', id);
    if (error) { toast.error('Failed to remove staff member'); return; }
    toast.success(`${name} removed from staff`);
    fetchStaff();
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'off-duty' : 'active';
    await supabase.from('staff_profiles').update({ status: newStatus }).eq('id', id);
    fetchStaff();
  };

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in relative">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest">Staff Directory</h1>
          <p className="font-bold text-gray-600 mt-1">{staff.length} registered · {staff.filter(s => s.status === 'active').length} active</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus size={18} strokeWidth={3} /> Add Staff Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] text-white border-none shadow-[4px_4px_0px_#FFE500]">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-1">Total Staff</h3>
          <p className="text-4xl font-black text-electricYellow">{staff.length}</p>
        </Card>
        <Card className="border-4 border-[#1a1a1a]">
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Active Now</h3>
          <p className="text-4xl font-black text-green">{staff.filter(s => s.status === 'active').length}</p>
        </Card>
        <Card className="border-4 border-[#1a1a1a]">
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Registered (Google)</h3>
          <p className="text-4xl font-black text-blue">{staff.filter(s => s.user_id).length}</p>
        </Card>
        <Card className="border-4 border-[#1a1a1a] bg-electricYellow">
          <h3 className="text-xs font-bold uppercase text-[#1a1a1a]/60 mb-1">Pending Login</h3>
          <p className="text-4xl font-black">{staff.filter(s => !s.user_id).length}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-4 py-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#1a1a1a] text-white">
                  <th className="p-4 font-black uppercase tracking-wider text-sm border-r-2 border-gray-700">Staff Member</th>
                  <th className="p-4 font-black uppercase tracking-wider text-sm border-r-2 border-gray-700">Role</th>
                  <th className="p-4 font-black uppercase tracking-wider text-sm border-r-2 border-gray-700">Bay</th>
                  <th className="p-4 font-black uppercase tracking-wider text-sm border-r-2 border-gray-700">Rate</th>
                  <th className="p-4 font-black uppercase tracking-wider text-sm border-r-2 border-gray-700">Status</th>
                  <th className="p-4 font-black uppercase tracking-wider text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`border-t-2 border-[#1a1a1a] font-bold hover:bg-electricYellow/5 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-cream'}`}>
                    <td className="p-4 border-r-2 border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1a1a1a] text-electricYellow border-2 border-[#1a1a1a] flex items-center justify-center font-black text-lg shrink-0">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-black leading-none">{s.name}</p>
                          <p className="text-xs text-gray-500 font-bold">{s.email}</p>
                          {!s.user_id && (
                            <span className="text-[9px] bg-orange/20 text-orange font-black uppercase px-1 py-0.5">Pending First Login</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r-2 border-gray-200">
                      <span className={`px-2 py-1 text-xs font-black uppercase border-2 border-[#1a1a1a] ${s.role === 'MANAGER' ? 'bg-electricYellow' : 'bg-cream'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-gray-200 font-mono font-black">{s.bay_number}</td>
                    <td className="p-4 border-r-2 border-gray-200 font-black">₹ {s.hourly_rate}/hr</td>
                    <td className="p-4 border-r-2 border-gray-200">
                      <button
                        onClick={() => handleToggleStatus(s.id, s.status)}
                        className={`px-2 py-1 text-xs font-black uppercase border-2 cursor-pointer transition-colors ${s.status === 'active'
                          ? 'bg-green text-white border-green hover:bg-green/80'
                          : 'bg-gray-200 text-gray-600 border-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        {s.status}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRemove(s.id, s.name)}
                        className="p-2 text-gray-400 hover:text-red transition-colors border-2 border-transparent hover:border-red"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center font-black uppercase text-gray-400">
                      <Users size={48} className="mx-auto mb-3 opacity-30" />
                      {searchTerm ? 'No results found' : 'No staff registered yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-cream border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] p-6 w-full max-w-md animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase">Add Staff Member</h2>
                <p className="text-xs font-bold text-gray-500">They can log in with the Gmail you enter below.</p>
              </div>
              <button onClick={() => setShowModal(false)}><X size={24} strokeWidth={3} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Marcus Vance"
                  className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Gmail Address *</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="mechanic@gmail.com" type="email"
                  className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow" />
                <p className="text-xs text-orange font-bold mt-1">⚠ This Gmail must match what they use to sign in with Google</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none">
                    <option value="TECHNICIAN">Technician</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Bay Number</label>
                  <input value={form.bay_number} onChange={e => setForm(f => ({ ...f, bay_number: e.target.value }))}
                    placeholder="Bay 01"
                    className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Hourly Rate (₹)</label>
                <input value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: Number(e.target.value) }))}
                  type="number" placeholder="300"
                  className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-[#1a1a1a] font-black uppercase hover:bg-gray-100">Cancel</button>
              <button onClick={handleAddStaff} disabled={saving}
                className="flex-1 py-3 bg-electricYellow border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] font-black uppercase hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-60">
                {saving ? 'Adding...' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
