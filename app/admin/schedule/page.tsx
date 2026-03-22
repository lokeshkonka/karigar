'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_HEIGHT = 90;
const BAYS = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5'];
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function formatHourLabel(hour24: number) {
  const d = new Date();
  d.setHours(hour24, 0, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

function formatRange(startIso: string, durationHours: number) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const startText = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const endText = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${startText} - ${endText}`;
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const changeDate = (days: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setCurrentDate(next);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  async function fetchAppointments() {
    setLoading(true);

    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select('id, bay, start_time, duration_hours, title, type')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: true });

    if (!error && data) {
      setAppointments(
        data.map((appointment) => {
          const startDate = new Date(appointment.start_time);
          const startOffsetHours = startDate.getHours() + startDate.getMinutes() / 60 - START_HOUR;
          const durationHours = Number(appointment.duration_hours) > 0 ? Number(appointment.duration_hours) : 1;

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
          };
        })
      );
    } else {
      setAppointments([]);
    }
    setLoading(false);
  }

  const totalGridHeight = HOURS.length * SLOT_HEIGHT;
  const currentTimePosition = ((currentTime.getHours() + currentTime.getMinutes() / 60) - START_HOUR) * SLOT_HEIGHT;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a] flex items-center gap-3">
            <CalIcon size={36} /> Schedule
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center bg-white border-neo px-1 h-12">
            <Button variant="outline" className="px-3 border-none flex-1 h-full shadow-none hover:bg-gray-100" onClick={() => changeDate(-1)}><ChevronLeft size={20} /></Button>
            <span className="font-black text-sm uppercase tracking-widest w-[130px] text-center">
              {currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <Button variant="outline" className="px-3 border-none flex-1 h-full shadow-none hover:bg-gray-100" onClick={() => changeDate(1)}><ChevronRight size={20} /></Button>
            <div className="w-[2px] h-6 bg-gray-200 mx-2"></div>
            <Button variant="outline" className="text-[10px] uppercase font-black tracking-widest border-none shadow-none text-[#1a1a1a] hover:bg-electricYellow h-full px-4" onClick={() => setCurrentDate(new Date())}>Today</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border-neo shadow-neo overflow-auto relative">
        <div className="min-w-[800px]">
          <div className="grid border-b-4 border-[#1a1a1a] sticky top-0 bg-white z-20" style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}>
            <div className="p-4 border-r-4 border-[#1a1a1a] bg-cream flex items-center justify-center">
              <span className="font-black text-xs uppercase tracking-widest text-gray-500">TIME</span>
            </div>
            {BAYS.map((bay, i) => (
              <div key={bay} className={`p-4 font-black uppercase tracking-widest text-center text-lg ${i !== BAYS.length - 1 ? 'border-r-2 border-[#1a1a1a]' : ''}`}>
                {bay}
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 z-0">
              {HOURS.map((hour) => (
                <div key={hour} className="grid border-b-2 border-gray-200" style={{ gridTemplateColumns: '100px repeat(5, 1fr)', height: `${SLOT_HEIGHT}px` }}>
                  <div className="border-r-4 border-[#1a1a1a] bg-cream p-2 flex justify-center items-start">
                    <span className="font-bold text-sm">{formatHourLabel(hour)}</span>
                  </div>
                  {BAYS.map((bay, colIdx) => (
                    <div key={`${hour}-${bay}`} className={`border-r-2 border-dashed border-gray-200 ${colIdx === BAYS.length - 1 ? 'border-r-0' : ''}`}></div>
                  ))}
                </div>
              ))}
            </div>

            <div className="absolute inset-0 z-10 pointer-events-none" style={{ marginLeft: '100px' }}>
              <div className="grid h-full" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {BAYS.map((bayTitle, colIndex) => {
                  const bayAppointments = appointments.filter((appointment) => appointment.bay === bayTitle);
                  return (
                    <div key={`col-${colIndex}`} className="relative" style={{ height: `${totalGridHeight}px` }}>
                      {bayAppointments.map((appointment) => {
                        const top = Math.max(0, appointment.startOffsetHours * SLOT_HEIGHT) + 4;
                        const height = Math.max(28, appointment.durationHours * SLOT_HEIGHT - 8);
                        return (
                          <div
                            key={appointment.id}
                            className={`absolute w-[calc(100%-16px)] left-2 p-3 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_rgba(0,0,0,0.2)] ${appointment.color}`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              zIndex: 15
                            }}
                          >
                            <p className="font-black uppercase text-sm leading-tight mb-1">{appointment.title || 'Service'}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest opacity-80 ${appointment.color.includes('text-black') ? 'text-black' : 'text-white'}`}>
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

            {currentTimePosition >= 0 && currentTimePosition <= totalGridHeight && (
              <div className="absolute left-0 right-0 z-20 flex" style={{ top: `${currentTimePosition}px` }}>
                <div className="w-[100px] text-right pr-2">
                  <span className="bg-red text-white font-bold text-xs px-1 rounded-sm">
                    {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <div className="flex-1 border-t-2 border-red relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red"></div>
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="p-6 text-center font-bold text-gray-500 uppercase tracking-widest border-t-2 border-dashed border-gray-300">
              Loading appointments...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
