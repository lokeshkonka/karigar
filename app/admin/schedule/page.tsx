'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const BAYS = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5'];

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
    start.setHours(0,0,0,0);
    const end = new Date(currentDate);
    end.setHours(23,59,59,999);

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString());

    if (!error && data) {
      setAppointments(data.map(a => ({
        id: a.id,
        bay: a.bay,
        startRow: a.start_row || 1, // Fallback logic
        span: a.duration_hours || 1,
        title: a.title || 'Service',
        type: a.type || 'service',
        color: a.color || 'bg-blue text-white'
      })));
    }
    setLoading(false);
  }

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
          <Button className="flex items-center gap-2 h-12">
            <Plus size={18} strokeWidth={3} />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border-neo shadow-neo overflow-auto relative">
        <div className="min-w-[800px]">
          {/* Header Row (Bays) */}
          <div className="grid border-b-4 border-[#1a1a1a] sticky top-0 bg-white z-20" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
            <div className="p-4 border-r-4 border-[#1a1a1a] bg-cream flex items-center justify-center">
              <span className="font-black text-xs uppercase tracking-widest text-gray-500">TIME</span>
            </div>
            {BAYS.map((bay, i) => (
              <div key={bay} className={`p-4 font-black uppercase tracking-widest text-center text-lg ${i !== BAYS.length - 1 ? 'border-r-2 border-[#1a1a1a]' : ''}`}>
                {bay}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 z-0">
              {HOURS.map((hour, idx) => (
                <div key={hour} className="grid border-b-2 border-gray-200" style={{ gridTemplateColumns: '80px repeat(5, 1fr)', height: '100px' }}>
                  <div className="border-r-4 border-[#1a1a1a] bg-cream p-2 flex justify-center items-start">
                    <span className="font-bold text-sm">{hour}</span>
                  </div>
                  {BAYS.map((bay, colIdx) => (
                    <div key={`${hour}-${bay}`} className={`border-r-2 border-dashed border-gray-200 ${colIdx === BAYS.length - 1 ? 'border-r-0' : ''}`}></div>
                  ))}
                </div>
              ))}
            </div>

            {/* Render Appointments (Absolute positioned over the grid) */}
            <div className="absolute inset-0 z-10 pointers-events-none" style={{ marginLeft: '80px' }}>
              <div className="grid h-full" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {BAYS.map((bayTitle, colIndex) => {
                  const bayAppts = appointments.filter(a => a.bay === bayTitle);
                  
                  return (
                    <div key={`col-${colIndex}`} className="relative h-[1000px]"> {/* 10 hours * 100px */}
                      {bayAppts.map(appt => (
                        <div 
                          key={appt.id}
                          className={`absolute w-[calc(100%-16px)] left-2 p-3 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer ${appt.color}`}
                          style={{
                            top: `${(appt.startRow - 1) * 100 + 4}px`, 
                            height: `${(appt.span * 100) - 8}px`,
                            zIndex: 15
                          }}
                        >
                          <p className="font-black uppercase text-sm leading-tight mb-1">{appt.title}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest opacity-80 ${appt.color.includes('text-black') ? 'text-black' : 'text-white'}`}>
                            {appt.startRow + 7}:00 - {appt.startRow + 7 + appt.span}:00
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Time Indicator Line (Dynamic) */}
            {currentTime.getHours() >= 8 && currentTime.getHours() <= 17 && (
              <div className="absolute left-0 right-0 z-20 flex" 
                style={{ top: `${Math.max(0, ((currentTime.getHours() - 8) + (currentTime.getMinutes() / 60)) * 100)}px` }}
              >
                <div className="w-[80px] text-right pr-2">
                  <span className="bg-red text-white font-bold text-xs px-1 rounded-sm">
                    {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex-1 border-t-2 border-red relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red"></div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
