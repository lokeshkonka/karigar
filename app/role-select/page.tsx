'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Wrench, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// This page is shown when a freshly logged-in user needs to identify their role
// It's navigated to manually if needed, or from login when role is ambiguous
export default function RoleSelectPage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // If already has a definitive role, redirect immediately
    if (user?.role && user.role !== 'CUSTOMER') {
      if (user.role === 'OWNER' || user.role === 'MANAGER') router.replace('/admin/dashboard');
      else if (user.role === 'TECHNICIAN') router.replace('/staff/dashboard');
    }
  }, [user, router]);

  const chooseCustomer = async () => {
    if (!user) { router.replace('/login'); return; }
    setChecking(true);
    const normalizedEmail = user.email.trim().toLowerCase();
    
    // Auto-create customer record if it doesn't exist
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!existingCustomer) {
      await supabase.from('customers').insert({
        user_id: user.id,
        email: normalizedEmail,
        name: user.name || 'New Customer',
        phone: 'N/A'
      });
    }

    setUser({ ...user, role: 'CUSTOMER' });
    setChecking(false);
    toast.success('Welcome to the Garage!');
    router.replace('/portal/home');
  };

  const chooseWorker = async () => {
    if (!user) { router.replace('/login'); return; }
    setChecking(true);
    const normalizedEmail = user.email.trim().toLowerCase();

    const { data } = await supabase
      .from('staff_profiles')
      .select('id, role, name, bay_number')
      .eq('email', normalizedEmail)
      .maybeSingle();

    setChecking(false);

    if (data) {
      const role = data.role as 'OWNER' | 'MANAGER' | 'TECHNICIAN';
      setUser({ ...user, role });
      toast.success(`Welcome, ${data.name}! Clocking in to ${data.bay_number}`);
      router.replace(role === 'OWNER' || role === 'MANAGER' ? '/admin/dashboard' : '/staff/dashboard');
    } else {
      toast.error('Your email is not registered as a staff member. Contact the admin.');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-8">
      <div className="bg-[#1a1a1a] px-8 py-4 -rotate-1 border-neo">
        <h1 className="text-4xl font-black text-electricYellow uppercase tracking-widest">GarageOS</h1>
      </div>

      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-black uppercase text-[#1a1a1a] text-center mb-2">Who are you?</h2>
        <p className="text-center text-sm font-bold text-gray-500 mb-8 uppercase tracking-wide">Select your role to continue</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={chooseCustomer}
            className="w-full py-6 bg-white border-4 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-black uppercase tracking-widest text-lg flex flex-col items-center gap-2 hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group"
          >
            <User size={36} strokeWidth={2} className="text-blue group-hover:scale-110 transition-transform" />
            I am a Customer
            <span className="text-xs font-bold text-gray-500 normal-case tracking-normal">Track my vehicle service</span>
          </button>

          <button
            onClick={chooseWorker}
            disabled={checking}
            className="w-full py-6 bg-electricYellow border-4 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-black uppercase tracking-widest text-lg flex flex-col items-center gap-2 hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-60 disabled:pointer-events-none group"
          >
            {checking
              ? <Loader2 size={36} strokeWidth={2} className="animate-spin" />
              : <Wrench size={36} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
            }
            {checking ? 'Verifying credentials...' : 'I am Workshop Staff'}
            <span className="text-xs font-bold text-[#1a1a1a]/60 normal-case tracking-normal">Mechanics & Technicians only</span>
          </button>
        </div>
      </div>
    </div>
  );
}
