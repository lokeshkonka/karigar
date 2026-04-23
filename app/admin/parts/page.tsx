'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Package, Clock, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PartsTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  async function loadTickets() {
    setLoading(true);
    const { data, error } = await supabase
      .from('parts_tickets')
      .select('*, work_orders(plate, type), staff_profiles(name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  }

  useEffect(() => { loadTickets(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('parts_tickets').update({ status: newStatus }).eq('id', id);
    if (!error) {
      toast.success(`Ticket marked as ${newStatus.toUpperCase()}`);
      loadTickets();
    } else {
      toast.error('Failed to update ticket');
    }
  };

  const filtered = tickets.filter(t => filter === 'ALL' || t.status.toUpperCase() === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">Parts Tickets</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{tickets.length} Total Requests</p>
        </div>
      </div>

      <div className="flex gap-2 border-neo p-2 bg-cream w-max">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SOURCED'].map(f => (
          <Button key={f} variant={filter === f ? 'primary' : 'outline'} onClick={() => setFilter(f)} className="px-4 py-2 font-black uppercase text-xs">
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full"><Loader /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center border-4 border-dashed border-[#1a1a1a]/20">
             <Package size={48} className="mx-auto text-gray-300 mb-4" />
             <p className="font-black text-xl text-gray-400 uppercase">No tickets found.</p>
          </div>
        ) : filtered.map(t => (
          <Card key={t.id} className="border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] flex flex-col p-6 relative bg-white">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-[#1a1a1a] text-electricYellow px-3 py-1 font-mono tracking-widest text-sm font-black border-neo-sm">
                 {t.work_orders?.[0]?.plate || t.work_orders?.plate || 'Unknown WO'}
              </span>
              <Badge className={
                t.status === 'pending' ? 'bg-orange text-[#1a1a1a]' :
                t.status === 'approved' ? 'bg-blue text-[#1a1a1a]' :
                t.status === 'sourced' ? 'bg-green text-[#1a1a1a]' :
                'bg-red text-[#1a1a1a]'
              }>{t.status.toUpperCase()}</Badge>
            </div>
            
            <h3 className="text-2xl font-black uppercase mb-1 leading-none">{t.part_name}</h3>
            <p className="text-sm font-bold text-gray-500 uppercase mb-4">QTY: {t.quantity}</p>
            
            <div className="bg-cream border-2 border-[#1a1a1a] p-3 mb-6 flex-1">
              <p className="font-bold text-sm">"{t.notes || 'No description provided'}"</p>
              <p className="text-xs font-black text-gray-400 uppercase mt-4 text-right">— {t.staff_profiles?.name || 'Technician'}</p>
            </div>

            {t.status === 'pending' && (
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Button onClick={() => updateStatus(t.id, 'approved')} className="bg-blue hover:bg-blue-600 border-none text-[#1a1a1a] flex gap-2">
                  <CheckCircle size={16} /> Approve
                </Button>
                <Button onClick={() => updateStatus(t.id, 'rejected')} className="bg-red hover:bg-red-600 border-none text-[#1a1a1a] flex gap-2">
                  <XCircle size={16} /> Reject
                </Button>
              </div>
            )}
            
            {t.status === 'approved' && (
              <div className="mt-auto">
                <Button onClick={() => updateStatus(t.id, 'sourced')} className="w-full bg-green hover:bg-green-600 border-none text-[#1a1a1a] flex justify-center gap-2">
                  <CheckCircle size={16} /> Mark Sourced
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
