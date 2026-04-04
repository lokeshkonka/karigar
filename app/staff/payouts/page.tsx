'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { DollarSign, Clock, CheckCircle, FilePlus } from 'lucide-react';
import toast from 'react-hot-toast';

const PAYOUT_SHARE = 0.4;

interface PayoutRow {
  id: string;
  amount: number | string;
  status: string;
  created_at: string;
}

interface StaffProfile {
  id: string;
  name: string;
}

interface WorkOrderRevenueRow {
  invoices: { amount: number | string | null; status: string | null } | { amount: number | string | null; status: string | null }[] | null;
}

export default function StaffPayoutsPage() {
  const { user } = useAuthStore();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, thisMonth: 0 });
  const [unclaimedRevenue, setUnclaimedRevenue] = useState(0);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);

  const fetchPayouts = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);

    const { data: profile } = await supabase.from('staff_profiles').select('id, name').eq('email', user.email).maybeSingle();
    if (!profile) {
      setLoading(false);
      return;
    }
    setStaffProfile(profile);

    // Fetch existing payouts
    const { data: payoutData } = await supabase
      .from('payouts')
      .select('*')
      .eq('staff_id', profile.id)
      .order('created_at', { ascending: false });

    if (payoutData) {
      setPayouts(payoutData);
      let tot = 0, pen = 0, curr = 0;
      const today = new Date();
      payoutData.forEach((p: PayoutRow) => {
        const amt = Number(p.amount) || 0;
        if (p.status === 'paid') tot += amt;
        if (p.status === 'pending') pen += amt;
        const pd = new Date(p.created_at);
        if (pd.getMonth() === today.getMonth() && pd.getFullYear() === today.getFullYear()) {
          curr += amt;
        }
      });
      setStats({ total: tot, pending: pen, thisMonth: curr });

      // Calculate unclaimed completed invoice revenue as real 40% share minus already raised payouts.
      const { data: woData } = await supabase
        .from('work_orders')
        .select('id, invoices(amount, status)')
        .eq('assigned_mechanic_id', profile.id)
        .eq('status', 'DELIVERED');

      if (woData) {
        let paidInvoiceRevenue = 0;
        (woData as WorkOrderRevenueRow[]).forEach((wo) => {
          if (Array.isArray(wo.invoices)) {
            wo.invoices.forEach((inv) => {
              if (inv.status === 'paid') paidInvoiceRevenue += Number(inv.amount) || 0;
            });
          } else if (wo.invoices) {
            const inv = wo.invoices;
            if (inv.status === 'paid') paidInvoiceRevenue += Number(inv.amount) || 0;
          }
        });

        const eligibleShare = paidInvoiceRevenue * PAYOUT_SHARE;
        const alreadyIssued = tot + pen;
        const remaining = eligibleShare - alreadyIssued;
        setUnclaimedRevenue(remaining > 0 ? remaining : 0);
      } else {
        setUnclaimedRevenue(0);
      }
    } else {
      setPayouts([]);
      setStats({ total: 0, pending: 0, thisMonth: 0 });
      setUnclaimedRevenue(0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPayouts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPayouts]);

  const handleCreateReceipt = async () => {
    if (unclaimedRevenue <= 0) return toast.error("No unclaimed revenue available.");
    if (!staffProfile) return;

    setLoading(true);
    await supabase.from('payouts').insert({
      staff_id: staffProfile.id,
      amount: unclaimedRevenue.toFixed(2),
      status: 'pending'
    });
    toast.success("Payout Receipt Generated! Admin verification pending.");
    await fetchPayouts();
  };

  if (loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a] flex items-center gap-3">
            <DollarSign size={36} /> Earnings & Payouts
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-electricYellow border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-6 text-[#1a1a1a]">
          <span className="font-black uppercase tracking-widest text-sm text-gray-700 block mb-2">Lifetime Earnings</span>
          <p className="text-5xl font-mono font-black">₹{stats.total}</p>
        </Card>
        
        <Card className="bg-cream border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-6 text-[#1a1a1a]">
          <span className="font-black uppercase tracking-widest text-sm text-gray-500 block mb-2">This Month</span>
          <p className="text-5xl font-mono font-black text-green-700">₹{stats.thisMonth}</p>
        </Card>

        <Card className="bg-[#1a1a1a] border-4 border-gray-800 shadow-[6px_6px_0_#000] p-6 text-white">
          <span className="font-black uppercase tracking-widest text-sm text-gray-400 block mb-2">Pending Release</span>
          <p className="text-5xl font-mono font-black text-orange">₹{stats.pending}</p>
        </Card>
      </div>

      {unclaimedRevenue > 0 && (
        <div className="bg-cream border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-6 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="font-black uppercase tracking-widest text-sm text-gray-500 block mb-2">Unclaimed Revenue Check</span>
            <p className="text-sm font-bold text-gray-700 max-w-lg">
              You have approximately <span className="text-green-600 font-mono font-black">₹{unclaimedRevenue.toFixed(2)}</span> in recent verified invoices that have not been added to a payout cycle yet.
            </p>
          </div>
          <Button onClick={handleCreateReceipt} className="bg-blue hover:bg-blue-600 text-white font-black uppercase tracking-widest border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] transition-all hover:translate-x-[2px] hover:translate-y-[2px] py-6 px-6 flex items-center gap-3 shrink-0">
            <FilePlus size={24} />
            Request Payout
          </Button>
        </div>
      )}

      <h2 className="text-2xl font-black uppercase tracking-widest text-[#1a1a1a] mt-8 mb-4 border-b-2 border-[#1a1a1a] inline-block pb-1">Payout History</h2>
      
      <div className="space-y-4">
        {payouts.length === 0 ? (
          <p className="p-12 text-center text-gray-500 font-bold uppercase border-4 border-dashed border-gray-300">No payment history found.</p>
        ) : payouts.map(p => (
          <Card key={p.id} className="bg-white border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] flex justify-between items-center p-6 mx-2 hover:translate-x-1 transition-transform">
            <div className="flex gap-4 items-center">
              <div className={`p-3 border-2 border-[#1a1a1a] ${p.status === 'paid' ? 'bg-green text-white' : 'bg-orange text-white'}`}>
                {p.status === 'paid' ? <CheckCircle size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <p className="text-2xl font-black uppercase text-[#1a1a1a] font-mono tracking-widest">₹{p.amount}</p>
                <p className="text-xs font-bold text-gray-500 uppercase mt-1">Processed: {new Date(p.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            <Badge className={`${p.status === 'paid' ? 'bg-green text-white' : 'bg-orange text-white'} uppercase font-black px-3 py-1`}>
              {p.status}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
