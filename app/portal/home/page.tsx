'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Wrench, CheckCircle2, ChevronRight, Calendar,
  LogOut, Plus, Star
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

const STEPS = ['Received', 'Diagnosed', 'Repairing', 'QC Check', 'Ready'];
const STATUS_TO_STEP: Record<string, number> = {
  'WAITING': 1,
  'DIAGNOSED': 2,
  'INPROGRESS': 3,
  'QUALITY': 4,
  'READY': 5,
};

export default function CustomerHomePage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  
  const [activeJob, setActiveJob] = useState<any>(null);
  const [bookedServices, setBookedServices] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDash() {
      if (!user?.email) return;

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (!customer) {
        setLoading(false);
        return;
      }

      // Fetch vehicles
      const { data: vData } = await supabase.from('vehicles').select('*').eq('customer_id', customer.id);
      if (vData) setVehicles(vData);

      // Fetch active job
      const { data: jobData } = await supabase
        .from('work_orders')
        .select(`*, vehicles(plate), appointments(bay)`)
        .eq('customer_id', customer.id)
        .neq('status', 'DELIVERED')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (jobData) {
        let jobBay = 'Garage';
        if (Array.isArray(jobData.appointments)) {
           jobBay = jobData.appointments[0]?.bay || 'Garage';
        } else if (jobData.appointments) {
           jobBay = (jobData.appointments as any).bay || 'Garage';
        }

        setActiveJob({
          plate: Array.isArray(jobData.vehicles) ? jobData.vehicles[0]?.plate : (jobData.vehicles as any)?.plate || 'Unknown',
          service: jobData.type,
          status: jobData.status,
          bay: jobBay,
          step: STATUS_TO_STEP[jobData.status] || 1,
          eta: 'Pending',
          amount: 'Estimating',
        });
      }

      // Fetch all booked appointments for this customer (across dates)
      const { data: apptData } = await supabase
        .from('appointments')
        .select('id, bay, start_time, duration_hours, title, type, work_orders(status, type, plate)')
        .eq('customer_id', customer.id)
        .order('start_time', { ascending: true });

      if (apptData) {
        setBookedServices(apptData.map((appointment: any) => {
          const workOrder = Array.isArray(appointment.work_orders) ? appointment.work_orders[0] : appointment.work_orders;
          return {
            id: appointment.id,
            plate: workOrder?.plate || 'Unknown',
            service: workOrder?.type || appointment.title || 'Service',
            status: (workOrder?.status || 'WAITING').toUpperCase(),
            bay: appointment.bay || 'Unassigned',
            start: appointment.start_time,
            duration: appointment.duration_hours || 1,
          };
        }));
      } else {
        setBookedServices([]);
      }
      setLoading(false);
    }
    loadDash();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    toast.success('Signed Out');
  };

  return (
    <div className="space-y-8 pt-2 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-xs uppercase tracking-widest text-gray-500">Good day 👋</p>
          <h1 className="text-3xl font-black uppercase tracking-widest text-[#1a1a1a]">
            {user?.name?.split(' ')[0] || 'Driver'}!
          </h1>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 border-2 border-red text-red hover:bg-red hover:text-white transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Active Job Tracker */}
      {activeJob && (
        <section>
          <h2 className="font-black text-sm tracking-widest uppercase text-[#1a1a1a] border-b-4 border-electricYellow inline-block pb-1 mb-4">
            Current Service
          </h2>
          <Card className="bg-electricYellow text-[#1a1a1a] border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-5 relative overflow-hidden">
            <Wrench className="absolute -right-6 -bottom-6 opacity-20 text-[#1a1a1a]" size={140} />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-[#1a1a1a] text-electricYellow px-3 py-1 font-mono font-black tracking-widest text-base border-neo">
                  {activeJob.plate}
                </span>
                <Badge className="bg-[#1a1a1a] text-white border-0 shadow-none font-black uppercase tracking-widest px-3 py-1.5">{activeJob.status}</Badge>
              </div>

              <div>
                <h3 className="text-xl font-black uppercase">{activeJob.service}</h3>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-[#1a1a1a]/70">ETA: {activeJob.eta}</p>
                  <span className="text-sm font-black uppercase text-electricYellow bg-[#1a1a1a] px-2 py-0.5 tracking-widest">{activeJob.bay}</span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="relative pt-2">
                <div className="absolute top-[22px] left-0 w-full h-1 bg-gray-700 z-0" />
                <div
                  className="absolute top-[22px] left-0 h-1 bg-electricYellow z-0 transition-all"
                  style={{ width: `${((activeJob.step - 1) / (STEPS.length - 1)) * 100}%` }}
                />
                <div className="relative z-10 flex justify-between">
                  {STEPS.map((label, i) => {
                    const done = i < activeJob.step;
                    const active = i === activeJob.step - 1;
                    return (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-black
                          ${done ? 'bg-electricYellow text-[#1a1a1a] border-[#1a1a1a]' : 'bg-[#333] border-gray-600 text-gray-400'}
                          ${active ? 'ring-4 ring-electricYellow/30 scale-125' : ''}`}>
                          {done && !active ? <CheckCircle2 size={14} className="text-[#1a1a1a]" /> : i + 1}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-tight hidden sm:block ${done ? 'text-electricYellow' : 'text-gray-600'}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            {/* Amount & Actions */}
            <div className="bg-black/40 border border-dashed border-electricYellow/30 p-3 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-300 uppercase">Estimated Total</span>
              <span className="font-black text-electricYellow text-xl">{activeJob.amount}</span>
            </div>

            <div className="flex gap-3">
              <Link href="/portal/invoices" className="flex-1">
                <button className="w-full py-3 bg-white text-[#1a1a1a] font-black text-sm uppercase tracking-wider border-2 border-white hover:bg-gray-100 transition-colors">
                  View Invoice
                </button>
              </Link>
              <Link href="/portal/review">
                <button className="px-4 py-3 bg-electricYellow text-[#1a1a1a] border-2 border-electricYellow font-black">
                  <Star size={20} />
                </button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
      )}

      {/* Booked Services Schedule */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-black text-sm tracking-widest uppercase text-[#1a1a1a] border-b-4 border-orange inline-block pb-1">
            Booked Services
          </h2>
          <Link href="/portal/vehicles" className="text-xs font-black uppercase border-2 border-[#1a1a1a] px-3 py-2 hover:bg-[#1a1a1a] hover:text-white transition-colors">
            Manage Bookings
          </Link>
        </div>

        {loading ? (
          <Card className="border-2 border-dashed border-gray-300 p-6 text-center font-bold text-gray-500 uppercase">
            Loading booked services...
          </Card>
        ) : bookedServices.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 p-6 text-center font-bold text-gray-500 uppercase">
            No booked services yet
          </Card>
        ) : (
          <div className="space-y-3">
            {bookedServices.map((service) => {
              const start = new Date(service.start);
              const end = new Date(start.getTime() + Number(service.duration) * 60 * 60 * 1000);
              const isPast = end.getTime() < Date.now();
              return (
                <Card key={service.id} className="border-2 border-[#1a1a1a]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-black uppercase text-lg">{service.service}</p>
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        {service.plate} · {start.toLocaleDateString()} · {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#1a1a1a] text-white border-0 shadow-none">{service.status}</Badge>
                      <Badge className={`${isPast ? 'bg-gray-300 text-[#1a1a1a]' : 'bg-blue text-white'} border-0 shadow-none`}>
                        {isPast ? 'COMPLETED SLOT' : `BAY: ${service.bay}`}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* My Garage */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-black text-sm tracking-widest uppercase text-[#1a1a1a] border-b-4 border-blue inline-block pb-1">
            My Garage
          </h2>
          <Link href="/portal/vehicles">
            <button className="flex items-center gap-1 text-xs font-black uppercase border-2 border-[#1a1a1a] px-3 py-2 hover:bg-[#1a1a1a] hover:text-white transition-colors">
              <Plus size={14} strokeWidth={3} /> Add Vehicle
            </button>
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {vehicles.map((v: any) => (
            <Link href="/portal/vehicles" key={v.id}>
              <Card className="flex items-center gap-4 cursor-pointer hover:shadow-[6px_6px_0px_#1a1a1a] transition-shadow active:scale-95">
                <div className="w-12 h-12 bg-electricYellow border-2 border-[#1a1a1a] flex items-center justify-center shrink-0 font-black text-xl">
                  {v.make[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black uppercase text-lg leading-none">{v.make} {v.model}</h3>
                  <p className="text-xs text-gray-500 font-bold">{v.year} • Next service: {v.nextService}</p>
                </div>
                <div className="bg-[#1a1a1a] text-electricYellow font-mono text-xs px-2 py-1 font-black tracking-wider">
                  {v.plate}
                </div>
                <ChevronRight size={18} className="text-gray-400 shrink-0" />
              </Card>
            </Link>
          ))}
          <Link href="/portal/vehicles">
            <div className="border-2 border-dashed border-gray-400 p-4 flex items-center justify-center gap-2 text-gray-500 font-black uppercase text-sm hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors cursor-pointer">
              <Plus size={18} strokeWidth={3} /> Add Another Vehicle
            </div>
          </Link>
        </div>
      </section>

      {/* Book CTA */}
      <Link href="/portal/vehicles">
        <Button variant="primary" className="w-full py-5 text-lg flex items-center justify-center gap-3 uppercase tracking-widest">
          <Calendar size={22} strokeWidth={3} /> Book a Service
        </Button>
      </Link>

    </div>
  );
}
