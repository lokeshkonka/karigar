'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Banknote, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

interface Invoice {
  id: string;
  plate: string;
  service: string;
  date: string;
  amount: number;
  paid: boolean;
  mechanic_id?: string;
}

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchInvoices() {
      if (!user?.email) return;
      const { data: customer } = await supabase.from('customers').select('id').eq('email', user.email).maybeSingle();
      if (!customer) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('invoices')
        .select('*, work_orders(plate, type, assigned_mechanic_id)')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (data) {
        setInvoices(data.map((inv: any) => {
          const workOrder = Array.isArray(inv.work_orders) ? inv.work_orders[0] : inv.work_orders;
          return {
            id: inv.id,
            plate: workOrder?.plate || '—',
            service: workOrder?.type || 'Service',
            date: new Date(inv.created_at).toLocaleDateString(),
            amount: Number(inv.amount),
            paid: inv.status === 'paid',
            mechanic_id: workOrder?.assigned_mechanic_id
          };
        }));
      }
      setLoading(false);
    }
    fetchInvoices();
  }, [user]);

  const handlePay = async (id: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const inv = invoices.find(i => i.id === id);
    if (!inv || inv.paid) {
      setIsProcessing(false);
      return;
    }

    // 1. Optimistic backend update for mock payment
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', id);

    // 2. Generate Technician Payout (40%)
    if (inv.mechanic_id) {
      const payoutAmount = Math.floor(inv.amount * 0.40);
      await supabase.from('payouts').insert({
        staff_id: inv.mechanic_id,
        amount: payoutAmount,
        status: 'pending'
      });
    }

    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, paid: true } : inv));
    setConfirmId(null);
    toast.success('💵 Payment successful! 40% payout allocated to technician.', { duration: 4000 });
    setIsProcessing(false);
  };

  const pending = invoices.filter(i => !i.paid);
  const paid = invoices.filter(i => i.paid);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="border-b-4 border-[#1a1a1a] pb-4">
        <h1 className="text-3xl font-black uppercase tracking-widest">Invoices</h1>
        <p className="text-sm font-bold text-gray-500">Cash payments only · Accepted at counter</p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <h2 className="font-black text-sm uppercase tracking-widest mb-3 text-red">Pending Payment</h2>
          <div className="space-y-3">
            {pending.map(inv => (
              <Card key={inv.id} className="border-l-4 border-red">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none block mb-1">
                      {inv.id}
                    </span>
                    <p className="font-black text-lg uppercase leading-tight">{inv.service}</p>
                    <p className="text-xs font-bold text-gray-500">{inv.plate} · {inv.date}</p>
                  </div>
                  <Badge className="bg-red text-white border-0 shadow-none">UNPAID</Badge>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-gray-200">
                  <span className="font-black text-2xl">₹ {inv.amount.toLocaleString('en-IN')}</span>
                  <button
                    onClick={() => setConfirmId(inv.id)}
                    className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] text-electricYellow font-black uppercase text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#FFE500] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                  >
                    <Banknote size={18} strokeWidth={2.5} /> Pay Cash
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Paid History */}
      {paid.length > 0 && (
        <section>
          <h2 className="font-black text-sm uppercase tracking-widest mb-3 text-green-600">Payment History</h2>
          <div className="space-y-3">
            {paid.map(inv => (
              <Card key={inv.id} className="opacity-70 border-l-4 border-green">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none block mb-1">
                      {inv.id}
                    </span>
                    <p className="font-black text-lg uppercase leading-tight">{inv.service}</p>
                    <p className="text-xs font-bold text-gray-400">{inv.plate} · {inv.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green text-white border-0 shadow-none mb-1">PAID</Badge>
                    <p className="font-black text-lg">₹ {inv.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {invoices.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-black uppercase">No invoices yet</div>
      )}

      {/* Cash Payment Confirmation Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-cream border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] p-6 w-full max-w-sm animate-in slide-in-from-bottom duration-300">
            <button onClick={() => setConfirmId(null)} className="absolute top-4 right-4 hover:text-red">
              <X size={22} strokeWidth={3} />
            </button>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-electricYellow border-4 border-[#1a1a1a] mx-auto flex items-center justify-center">
                <Banknote size={36} strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-black uppercase">Confirm Cash Payment</h2>
              <p className="font-bold text-gray-600 text-sm">
                Please hand over the cash to the counter staff. Click below to confirm payment for invoice <strong>{confirmId}</strong>.
              </p>
              <div className="bg-[#1a1a1a] text-electricYellow p-4 font-black text-3xl tracking-widest">
                ₹ {invoices.find(i => i.id === confirmId)?.amount.toLocaleString('en-IN')}
              </div>
              <button
                onClick={() => handlePay(confirmId)}
                disabled={isProcessing}
                className="w-full py-4 bg-electricYellow border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-black uppercase text-lg tracking-wider flex items-center justify-center gap-2 hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <CheckCircle size={22} strokeWidth={2.5} /> 
                )}
                {isProcessing ? 'Processing...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
