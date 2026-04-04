'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_HEIGHT = 90;
const BAYS = ['Bay 01', 'Bay 02', 'Bay 03', 'Bay 04', 'Bay 05'];
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function formatHourLabel(hour24: number) {
  const d = new Date();
  d.setHours(hour24, 0, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

function formatRange(startIso: string, durationHours: number) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

function normalizeBayLabel(value: string | null | undefined) {
  if (!value) return '';
  const match = value.match(/\d+/);
  return match ? `Bay ${match[0].padStart(2, '0')}` : value.trim();
}

interface AppointmentRow {
  id: string;
  bay: string;
  start_time: string;
  durationHours: number;
  startOffsetHours: number;
  color: string;
  plate: string;
  serviceType: string;
}

interface AppointmentQueryRow {
  id: string;
  bay: string | null;
  start_time: string;
  duration_hours: number | null;
  title: string | null;
  type: string | null;
  work_orders:
    | { assigned_mechanic_id: string | null; plate: string | null; type: string | null }
    | { assigned_mechanic_id: string | null; plate: string | null; type: string | null }[]
    | null;
}

export default function StaffSchedulePage() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const changeDate = (days: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setCurrentDate(next);
  };

  const fetchAppointments = useCallback(async () => {
    if (!user?.email) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: profile } = await supabase.from('staff_profiles').select('id').eq('email', user.email).maybeSingle();
    if (!profile) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('appointments')
      .select('id, bay, start_time, duration_hours, title, type, work_orders!inner(assigned_mechanic_id, plate, type)')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: true });

    const filtered = ((data || []) as AppointmentQueryRow[]).filter((appointment) => {
      const workOrder = Array.isArray(appointment.work_orders) ? appointment.work_orders[0] : appointment.work_orders;
      return workOrder?.assigned_mechanic_id === profile.id;
    });

    setAppointments(
      filtered.map((appointment) => {
        const startDate = new Date(appointment.start_time);
        const startOffsetHours = startDate.getHours() + startDate.getMinutes() / 60 - START_HOUR;
        const durationHours = Number(appointment.duration_hours) > 0 ? Number(appointment.duration_hours) : 1;
        const workOrder = Array.isArray(appointment.work_orders) ? appointment.work_orders[0] : appointment.work_orders;

        const color =
          appointment.type === 'delivery'
            ? 'bg-green text-white'
            : appointment.type === 'diagnostic'
              ? 'bg-orange text-white'
              : 'bg-blue text-white';

        return {
          ...appointment,
          color,
          durationHours,
          startOffsetHours,
          bay: normalizeBayLabel(appointment.bay),
          plate: workOrder?.plate || 'N/A',
          serviceType: workOrder?.type || appointment.title || 'Service',
        };
      })
    );

    setLoading(false);
  }, [currentDate, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAppointments();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAppointments]);

  const totalGridHeight = HOURS.length * SLOT_HEIGHT;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-150px)] flex flex-col">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a] flex items-center gap-3">
            <CalIcon size={36} /> My Schedule
          </h1>
        </div>
        <div className="flex items-center bg-white border-neo px-1 h-12">
          <Button variant="outline" className="px-3 border-none h-full shadow-none hover:bg-gray-100" onClick={() => changeDate(-1)}><ChevronLeft size={20} /></Button>
          <span className="font-black text-sm uppercase tracking-widest w-[130px] text-center">
            {currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <Button variant="outline" className="px-3 border-none h-full shadow-none hover:bg-gray-100" onClick={() => changeDate(1)}><ChevronRight size={20} /></Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border-neo shadow-neo overflow-auto">
        <div className="min-w-[800px]">
          <div className="grid border-b-4 border-[#1a1a1a] sticky top-0 bg-white z-20" style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}>
            <div className="p-4 border-r-4 border-[#1a1a1a] bg-cream flex items-center justify-center">
              <span className="font-black text-xs uppercase tracking-widest text-gray-500">TIME</span>
            </div>
            {BAYS.map((bay, i) => (
              <div key={bay} className={`p-4 font-black uppercase tracking-widest text-center text-lg ${i !== BAYS.length - 1 ? 'border-r-2 border-[#1a1a1a]' : ''}`}>{bay}</div>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 z-0">
              {HOURS.map((hour) => (
                <div key={hour} className="grid border-b-2 border-gray-200" style={{ gridTemplateColumns: '100px repeat(5, 1fr)', height: `${SLOT_HEIGHT}px` }}>
                  <div className="border-r-4 border-[#1a1a1a] bg-cream p-2 flex justify-center items-start">
                    <span className="font-bold text-sm">{formatHourLabel(hour)}</span>
                  </div>
                  {BAYS.map((bay, idx) => (
                    <div key={`${hour}-${bay}`} className={`border-r-2 border-dashed border-gray-200 ${idx === BAYS.length - 1 ? 'border-r-0' : ''}`}></div>
                  ))}
                </div>
              ))}
            </div>

            <div className="absolute inset-0 z-10 pointer-events-none" style={{ marginLeft: '100px' }}>
              <div className="grid h-full" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {BAYS.map((bayTitle, idx) => {
                  const bayAppointments = appointments.filter((appointment) => appointment.bay === bayTitle);
                  return (
                    <div key={`staff-col-${idx}`} className="relative" style={{ height: `${totalGridHeight}px` }}>
                      {bayAppointments.map((appointment) => {
                        const top = Math.max(0, appointment.startOffsetHours * SLOT_HEIGHT) + 4;
                        const height = Math.max(28, appointment.durationHours * SLOT_HEIGHT - 8);
                        return (
                          <div
                            key={appointment.id}
                            className={`absolute w-[calc(100%-16px)] left-2 p-3 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_rgba(0,0,0,0.2)] ${appointment.color}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                          >
                            <p className="font-black uppercase text-sm leading-tight mb-1">{appointment.plate}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">{appointment.serviceType}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">
                              {formatRange(appointment.start_time, appointment.durationHours)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {loading && (
            <div className="p-6 text-center font-bold text-gray-500 uppercase tracking-widest border-t-2 border-dashed border-gray-300">
              Loading schedule...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
