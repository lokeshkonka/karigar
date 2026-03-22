'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPayoutsPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [recommendedPayout, setRecommendedPayout] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch active technician profiles. Existing code used role='staff', but DB stores role as TECHNICIAN/MANAGER.
    const { data: staffData } = await supabase
      .from('staff_profiles')
      .select('id, name, role, status, hourly_rate')
      .in('role', ['TECHNICIAN', 'MANAGER'])
      .order('name', { ascending: true });
    setStaffList(staffData || []);

    // Fetch previous Payouts History
    const { data: payoutData } = await supabase
      .from('payouts')
      .select('id, amount, status, created_at, staff_profiles(name)')
      .order('created_at', { ascending: false });
    setPayouts(payoutData || []);
    
    setLoading(false);
  }

  async function loadStaffJobs(staffId: string) {
    const staff = staffList.find(s => s.id === staffId);
    setSelectedStaff(staff);
    
    // Fetch completed/ready work orders for this staff
    const { data: jobs } = await supabase
      .from('work_orders')
      .select(`
        id, type, status, created_at, priority,
        invoices(amount, status),
        vehicles(plate)
      `)
      .eq('assigned_mechanic_id', staffId)
      .in('status', ['READY', 'DELIVERED'])
      .order('updated_at', { ascending: false });

    const safeJobs = jobs || [];
    setCompletedJobs(safeJobs);

    // Recommend payout as 30% of paid invoice revenue for these completed jobs.
    const paidRevenue = safeJobs.reduce((sum: number, job: any) => {
      const invoiceRows = Array.isArray(job.invoices) ? job.invoices : job.invoices ? [job.invoices] : [];
      const paidForJob = invoiceRows
        .filter((invoice: any) => invoice.status === 'paid')
        .reduce((acc: number, invoice: any) => acc + (Number(invoice.amount) || 0), 0);
      return sum + paidForJob;
    }, 0);

    const recommended = Math.max(0, Math.round(paidRevenue * 0.3));
    setRecommendedPayout(recommended);
    setPayoutAmount(recommended.toString());
  }

  const handleIssuePayout = async () => {
    if (!selectedStaff || !payoutAmount || Number(payoutAmount) <= 0) {
      toast.error('Invalid payout amount');
      return;
    }

    const { error } = await supabase.from('payouts').insert({
      staff_id: selectedStaff.id,
      amount: Number(payoutAmount),
      status: 'paid'
    });

    if (error) {
      toast.error('Failed to issue payout');
      console.error(error);
    } else {
      toast.success(`₹${payoutAmount} paid to ${selectedStaff.name}`);
      setPayoutAmount('');
      setSelectedStaff(null);
      setCompletedJobs([]);
      setRecommendedPayout(0);
      fetchData();
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    const { error } = await supabase.from('payouts').update({ status: 'paid' }).eq('id', payoutId);
    if (error) {
      toast.error('Failed to verify payout');
      console.error(error);
    } else {
      toast.success('Payout receipt verified & funds transferred!');
      fetchData();
    }
  };

  if (loading && staffList.length === 0) return <Loader fullScreen />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a] flex items-center gap-3">
            <DollarSign size={36} /> Staff Payouts
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Mechanic Selection & Payout Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-6">
            <h2 className="text-xl font-black uppercase tracking-widest mb-4 border-b-2 border-[#1a1a1a] pb-2">Select Technician</h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {staffList.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => loadStaffJobs(s.id)}
                  className={`w-full text-left p-3 border-2 font-bold uppercase transition-transform ${selectedStaff?.id === s.id ? 'bg-electricYellow border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] translate-x-1' : 'bg-cream border-dashed border-gray-400 hover:border-[#1a1a1a] hover:bg-gray-100'}`}
                >
                  <p className="text-[#1a1a1a]">{s.name}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{s.role}</p>
                </button>
              ))}
              {staffList.length === 0 && (
                <p className="text-sm font-bold text-gray-500 uppercase text-center py-4">No technician profiles found</p>
              )}
            </div>
          </Card>

          {selectedStaff && (
            <Card className="bg-white border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-6 animate-in slide-in-from-left">
              <h2 className="text-xl font-black uppercase tracking-widest mb-4">Manual Payout Issue</h2>
              <div className="bg-cream border-2 border-[#1a1a1a] p-4 text-center mb-6">
                <span className="text-xs font-bold uppercase text-gray-500 block mb-1">Technician</span>
                <span className="text-lg font-black uppercase text-[#1a1a1a]">{selectedStaff.name}</span>
              </div>
              
              <div className="mb-6">
                <label className="text-xs font-black uppercase text-gray-500 block mb-1">Total Payout Amount (₹)</label>
                <input 
                  type="number" 
                  value={payoutAmount} 
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full text-3xl font-black p-4 border-4 border-[#1a1a1a] outline-none focus:ring-4 focus:ring-electricYellow/50 text-center" 
                />
                <p className="text-xs font-bold text-gray-500 mt-2">
                  Recommended: ₹{recommendedPayout.toLocaleString()} ({completedJobs.length} completed jobs)
                </p>
              </div>

              <Button onClick={handleIssuePayout} className="w-full py-6 text-xl bg-green hover:bg-green-600 text-white border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] uppercase font-black tracking-widest">
                <CheckCircle size={24} className="mr-2" /> Submit Payout
              </Button>
            </Card>
          )}
        </div>

        {/* Right Column: Performance Jobs & History */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStaff && (
            <Card className="bg-white border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-6">
              <h2 className="text-xl font-black uppercase tracking-widest mb-4">
                Completed Jobs · {selectedStaff.name}
              </h2>
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {completedJobs.length === 0 ? (
                  <p className="text-sm font-bold text-gray-500 uppercase">No completed jobs found for this technician.</p>
                ) : (
                  completedJobs.map((job) => {
                    const vehicle = Array.isArray(job.vehicles) ? job.vehicles[0] : job.vehicles;
                    const invoiceRows = Array.isArray(job.invoices) ? job.invoices : job.invoices ? [job.invoices] : [];
                    const paidRevenue = invoiceRows
                      .filter((invoice: any) => invoice.status === 'paid')
                      .reduce((sum: number, invoice: any) => sum + (Number(invoice.amount) || 0), 0);
                    return (
                      <div key={job.id} className="border-2 border-dashed border-gray-300 p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black uppercase text-sm text-[#1a1a1a]">{job.type}</p>
                          <p className="text-xs font-bold text-gray-500">{vehicle?.plate || 'Unknown Plate'} · {new Date(job.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black uppercase text-gray-500">Paid Invoice</p>
                          <p className="font-black text-green-700">₹{paidRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          )}

          <Card className="bg-white border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-6">
            <h2 className="text-xl font-black uppercase tracking-widest mb-4">Payout Ledger</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-4 border-[#1a1a1a]">
                    <th className="py-2 px-4 uppercase font-black text-xs tracking-widest text-gray-500">Date</th>
                    <th className="py-2 px-4 uppercase font-black text-xs tracking-widest text-gray-500">Technician</th>
                    <th className="py-2 px-4 uppercase font-black text-xs tracking-widest text-gray-500">Amount</th>
                    <th className="py-2 px-4 uppercase font-black text-xs tracking-widest text-gray-500 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => (
                    <tr key={p.id} className="border-b-2 border-dashed border-gray-200 hover:bg-cream">
                      <td className="py-3 px-4 font-bold text-sm text-gray-600">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-black text-[#1a1a1a] uppercase">{p.staff_profiles?.name || 'Unknown'}</td>
                      <td className="py-3 px-4 font-black font-mono text-green-600">₹{p.amount}</td>
                      <td className="py-3 px-4 text-center">
                        {p.status === 'pending' ? (
                           <Button onClick={() => handleApprovePayout(p.id)} className="bg-electricYellow hover:bg-[#1a1a1a] hover:text-white text-[#1a1a1a] font-black uppercase text-xs tracking-widest py-1 h-auto border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]">Verify & Pay</Button>
                        ) : (
                           <Badge className="bg-green text-white border-0 shadow-none font-black px-3 py-1">PAID</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                     <tr><td colSpan={4} className="text-center py-6 text-gray-500 font-bold uppercase">No payouts recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
