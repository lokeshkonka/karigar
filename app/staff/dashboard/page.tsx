'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Play, CheckCircle, PackagePlus, Loader2, X, MapPin, Map } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffDashboardPage() {
  const { user } = useAuthStore();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [waitingJobs, setWaitingJobs] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [partForm, setPartForm] = useState({ name: '', qty: 1, notes: '' });

  // Bay Assignment UI
  const [showBayModal, setShowBayModal] = useState(false);
  const [bayForm, setBayForm] = useState('');

  // Invoice UI
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState<number | ''>('');

  useEffect(() => {
    load();
  }, [user]);

  async function load() {
    if (!user?.email) return;
    setLoading(true);

    const { data: profile } = await supabase.from('staff_profiles').select('id, name').eq('email', user.email).maybeSingle();
    if (!profile) { setLoading(false); return; }
    setProfileId(profile.id);

    // 1. Get active job
    const { data: active } = await supabase.from('work_orders')
      .select('id, type, notes, priority, issue_description, started_at, status, vehicles(plate, make, model, year), appointments(bay)')
      .eq('assigned_mechanic_id', profile.id)
      .eq('status', 'INPROGRESS')
      .maybeSingle();

    if (active) {
      const v: any = Array.isArray(active.vehicles) ? active.vehicles[0] : active.vehicles;
      const bay = active.appointments && active.appointments.length > 0 ? active.appointments[0].bay : 'Unassigned';
      setActiveJob({
        id: active.id,
        type: active.type,
        plate: v?.plate || 'UNKNOWN',
        desc: `${v?.make || ''} ${v?.model || ''}`,
        started_at: active.started_at,
        issue: active.issue_description || 'No complaint specified',
        notes: active.notes,
        bay: bay
      });
    } else {
      setActiveJob(null);
    }

    // 2. Get waiting queue (allotted to this tech)
    const { data: waiting } = await supabase.from('work_orders')
      .select('id, type, issue_description, priority, status, created_at, vehicles(plate, make, model)')
      .in('status', ['WAITING', 'DIAGNOSED'])
      .eq('assigned_mechanic_id', profile.id)
      .order('created_at', { ascending: true });

    if (waiting) setWaitingJobs(waiting);

    // 3. Get schedule (Appointments for today related to their work orders)
    const { data: appts } = await supabase.from('appointments')
      .select('id, bay, title, start_time, work_orders!inner(assigned_mechanic_id)')
      //.eq('work_orders.assigned_mechanic_id', profile.id) 
      .limit(5); // Simplify for demo
    
    // Manual filtering due to PostgREST inner join syntax limitation bypass
    const filteredAppts = (appts || []).filter((a: any) => a.work_orders && a.work_orders.assigned_mechanic_id === profile.id);
    setAppointments(filteredAppts);

    setLoading(false);
  }

  const handleStartJob = async (jobId: string) => {
    if (activeJob) { toast.error('You already have an active job!'); return; }
    await supabase.from('work_orders').update({
      status: 'INPROGRESS',
      started_at: new Date().toISOString()
    }).eq('id', jobId);
    toast.success('Job Started');
    load();
  };

  const openInvoiceModal = () => {
    if (!activeJob) return;
    setInvoiceAmount('');
    setShowInvoiceModal(true);
  };

  const handleCompleteJob = async () => {
    if (!activeJob || invoiceAmount === '') {
      toast.error('Please enter a valid amount');
      return;
    }

    // 1. Update WO to READY
    await supabase.from('work_orders').update({ status: 'READY' }).eq('id', activeJob.id); 

    // 2. Get customer_id to link invoice
    const { data: woData } = await supabase.from('work_orders').select('customer_id').eq('id', activeJob.id).single();

    // 3. Generate the Invoice
    await supabase.from('invoices').insert({
      work_order_id: activeJob.id,
      customer_id: woData?.customer_id || null,
      amount: Number(invoiceAmount),
      status: 'pending',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString()
    });

    toast.success('Job marked READY & Invoice sent to Customer!');
    setShowInvoiceModal(false);
    load();
  };

  const submitPartsRequest = async () => {
    if (!partForm.name) { toast.error('Part name required'); return; }
    await supabase.from('parts_tickets').insert({
      work_order_id: activeJob.id,
      requested_by: profileId,
      part_name: partForm.name,
      quantity: partForm.qty,
      notes: partForm.notes
    });
    toast.success('Parts request sent to Admin!');
    setShowPartsModal(false);
    setPartForm({ name: '', qty: 1, notes: '' });
  };

  const updateBay = async () => {
    if (!activeJob || !bayForm) return;
    
    // Check if appointment exists for this WO
    const { data: apptCheck } = await supabase.from('appointments').select('id').eq('work_order_id', activeJob.id).maybeSingle();
    
    if (apptCheck) {
      await supabase.from('appointments').update({ bay: bayForm }).eq('id', apptCheck.id);
    } else {
      await supabase.from('appointments').insert({
        work_order_id: activeJob.id,
        bay: bayForm,
        title: activeJob.type,
      });
    }
    toast.success('Bay assigned successfully!');
    setShowBayModal(false);
    load();
  };

  // Live timer array
  const [elapsed, setElapsed] = useState('00:00:00');
  useEffect(() => {
    if (!activeJob?.started_at) return;
    const interval = setInterval(() => {
      const ms = Date.now() - new Date(activeJob.started_at).getTime();
      const hrs = Math.floor(ms / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeJob]);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Top Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Job Dashboard */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-3xl font-black uppercase tracking-widest text-[#1a1a1a] border-b-4 border-[#1a1a1a] inline-block pb-1">Active Job</h2>
          
          {!activeJob ? (
            <Card className="bg-white border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-12 text-center text-gray-400 font-black uppercase tracking-widest">
              No active job assigned. Pick one from your allotted queue below.
            </Card>
          ) : (
            <Card className="bg-white border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#FFE500] p-6 lg:p-8 relative overflow-hidden text-[#1a1a1a]">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 border-b-4 border-[#1a1a1a] pb-6">
                <div>
                  <div className="bg-electricYellow text-black px-4 py-2 font-mono tracking-widest border-neo border-4 font-black text-2xl inline-block mb-2">
                    {activeJob.plate}
                  </div>
                  <p className="text-xl font-bold uppercase text-gray-600">{activeJob.desc}</p>
                </div>
                <div className="text-right">
                  <span className="uppercase text-sm font-black tracking-widest text-gray-500 block mb-1">Time Elapsed</span>
                  <span className="text-4xl font-black text-[#1a1a1a] font-mono animate-pulse">{elapsed}</span>
                </div>
              </div>

              <div className="flex justify-between items-start mb-4">
                <h3 className="text-3xl font-black uppercase leading-tight">{activeJob.type}</h3>
                <button 
                  onClick={() => setShowBayModal(true)}
                  className="flex items-center gap-2 bg-cream border-2 border-[#1a1a1a] px-3 py-1 font-black text-sm uppercase shadow-[2px_2px_0_#1a1a1a] hover:bg-electricYellow transition-colors"
                >
                  <MapPin size={16} /> {activeJob.bay}
                </button>
              </div>
              
              <div className="bg-cream p-4 border-l-8 border-orange mb-6">
                 <span className="block text-xs font-black text-orange uppercase tracking-wider mb-1">Customer Complaint / Issue</span>
                 <p className="text-[#1a1a1a] font-bold">{activeJob.issue}</p>
                 {activeJob.notes && <p className="text-gray-600 font-bold mt-2 text-sm italic">Admin Notes: {activeJob.notes}</p>}
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <Button onClick={openInvoiceModal} className="flex-1 py-5 text-[15px] font-black tracking-widest uppercase flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] border-2 border-[#1a1a1a]">
                  <CheckCircle size={22} /> MARK READY & SEND INVOICE
                </Button>
                <Button onClick={() => setShowPartsModal(true)} variant="outline" className="flex-1 py-5 text-[15px] font-black tracking-widest uppercase flex items-center justify-center gap-3 bg-white hover:bg-cream shadow-[4px_4px_0_#1a1a1a] border-4 border-[#1a1a1a] text-[#1a1a1a]">
                  <PackagePlus size={22} /> REQUEST PARTS
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Schedule Sidebar */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#1a1a1a] border-b-4 border-[#1a1a1a] inline-block pb-1">My Schedule</h2>
          <Card className="bg-white border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] p-4 min-h-[300px]">
            {appointments.length === 0 ? (
              <p className="text-gray-400 font-bold uppercase text-center py-8">No scheduled slots today.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map(a => (
                  <div key={a.id} className="border-2 border-dashed border-[#1a1a1a] p-3 flex flex-col gap-1 hover:bg-electricYellow/10 transition">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-sm uppercase truncate">{a.title}</span>
                      <span className="text-xs font-bold bg-cream border border-[#1a1a1a] px-2 py-0.5">{a.bay || 'No Bay'}</span>
                    </div>
                    {a.start_time && <span className="text-xs font-bold text-gray-500 uppercase">{new Date(a.start_time).toLocaleTimeString()}</span>}
                  </div>
                ))}
              </div>
            )}
            
            <Button variant="outline" className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-[#1a1a1a] text-xs">
              <Map size={14} /> Global Roster Calendar
            </Button>
          </Card>
        </div>
      </div>

      {/* Allotted Queue */}
      <h2 className="text-2xl font-black uppercase tracking-widest text-[#1a1a1a] border-b-4 border-[#1a1a1a] inline-block pb-1 mt-8">My Allotted Tasks</h2>
      <div className="space-y-4 max-w-4xl">
        {waitingJobs.length === 0 ? (
          <div className="border-4 border-dashed border-gray-300 p-8 text-center text-gray-400 font-black uppercase">Your queue is currently empty.</div>
        ) : waitingJobs.map(job => {
          const v = Array.isArray(job.vehicles) ? job.vehicles[0] : job.vehicles;
          return (
            <Card key={job.id} className="bg-white border-4 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-6 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#FFE500] transition-all">
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <div className="font-mono text-[#1a1a1a] font-black tracking-widest bg-electricYellow px-2 py-1 inline-block border-neo-sm text-sm">{v?.plate || 'UNKNOWN'}</div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 ${job.priority === 'urgent' ? 'bg-red text-white' : 'bg-gray-200 text-gray-600'}`}>{job.priority}</span>
                </div>
                <h4 className="text-[#1a1a1a] font-black uppercase text-xl leading-none">{job.type}</h4>
                <p className="text-sm font-bold text-gray-500 uppercase mt-1 line-clamp-1">{job.issue_description}</p>
              </div>
              <Button onClick={() => handleStartJob(job.id)} disabled={!!activeJob} className="shrink-0 bg-[#1a1a1a] text-white hover:bg-electricYellow hover:text-[#1a1a1a] border-2 border-[#1a1a1a] font-black uppercase tracking-wider py-6 px-8">
                <Play size={18} className="mr-2" /> Start Repair
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Parts Modal */}
      {showPartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-sm p-4">
          <Card className="bg-cream border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#1a1a1a] pb-2">
              <h3 className="text-2xl font-black uppercase tracking-widest text-[#1a1a1a]">Parts Ticket</h3>
              <button onClick={() => setShowPartsModal(false)}><X size={24} className="text-gray-500 hover:text-red" /></button>
             </div>
             <p className="text-xs font-bold text-gray-600 uppercase mb-4">Send a formal parts request to the Admin desk. It will automatically ping central inventory.</p>
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">Part Name / SKU</label>
                  <input value={partForm.name} onChange={e => setPartForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-white border-2 border-[#1a1a1a] p-3 font-bold focus:border-blue outline-none text-[#1a1a1a]" placeholder="e.g. Synthetic Oil 5W-30" />
               </div>
               <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">Quantity Required</label>
                  <input type="number" min="1" value={partForm.qty} onChange={e => setPartForm(p => ({ ...p, qty: parseInt(e.target.value)||1 }))} className="w-full bg-white border-2 border-[#1a1a1a] p-3 font-bold focus:border-blue outline-none text-[#1a1a1a]" />
               </div>
               <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">Urgency / Extra Notes</label>
                  <input value={partForm.notes} onChange={e => setPartForm(p => ({ ...p, notes: e.target.value }))} className="w-full bg-white border-2 border-[#1a1a1a] p-3 font-bold focus:border-blue outline-none text-[#1a1a1a]" placeholder="Required immediately for bay 4" />
               </div>
               <Button onClick={submitPartsRequest} className="w-full py-4 mt-4 bg-blue border-2 border-[#1a1a1a] text-white shadow-[4px_4px_0_#1a1a1a] text-lg font-black uppercase tracking-widest hover:bg-blue-600">Submit Ticket</Button>
             </div>
          </Card>
        </div>
      )}

      {/* Bay Modal */}
      {showBayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-sm p-4">
          <Card className="bg-white border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6 max-w-sm w-full relative">
            <button onClick={() => setShowBayModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-[#1a1a1a] transition-colors"><X size={20} /></button>
            <h3 className="text-xl font-black uppercase tracking-widest text-[#1a1a1a] mb-2">Assign Bay</h3>
            <p className="text-xs font-bold text-gray-500 uppercase mb-4">Move this vehicle to a new bay mapped on the floorplan.</p>
            <div className="space-y-4">
              <select value={bayForm} onChange={e => setBayForm(e.target.value)} className="w-full border-2 border-[#1a1a1a] p-3 font-black uppercase text-lg focus:ring-2 focus:ring-electricYellow outline-none bg-white">
                <option value="" disabled>Select Bay</option>
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={`Bay ${num}`}>Bay {num}</option>
                ))}
              </select>
              <Button onClick={updateBay} className="w-full p-4 font-black tracking-widest uppercase bg-electricYellow text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">Update Location</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Invoice Cost Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-sm p-4">
          <Card className="bg-cream border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6 max-w-sm w-full relative">
            <button onClick={() => setShowInvoiceModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red transition-colors"><X size={20} className="hover:text-red" /></button>
            <h3 className="text-2xl font-black uppercase tracking-widest text-[#1a1a1a] mb-2">Finalize Invoice</h3>
            <p className="text-xs font-bold text-gray-500 uppercase mb-4">Enter the final cost of labor and parts combined to bill the customer.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">Total Bill Amount (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  value={invoiceAmount} 
                  onChange={e => setInvoiceAmount(e.target.value ? Number(e.target.value) : '')} 
                  className="w-full bg-white border-2 border-[#1a1a1a] p-3 font-black focus:border-[#1a1a1a] outline-none text-[#1a1a1a] text-xl focus:ring-2 focus:ring-electricYellow" 
                  placeholder="e.g. 4500" 
                />
              </div>
              <Button onClick={handleCompleteJob} className="w-full p-4 font-black tracking-widest uppercase bg-green-500 text-white border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] hover:bg-green-600">Send Invoice</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
