'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { LogOut, Mail, User, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    toast.success('Signed Out');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="border-b-4 border-[#1a1a1a] pb-4">
        <h1 className="text-3xl font-black uppercase tracking-widest">My Profile</h1>
      </div>

      {/* Avatar card */}
      <Card className="bg-electricYellow text-[#1a1a1a] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] flex items-center gap-5 p-6 relative overflow-hidden">
        <div className="w-20 h-20 bg-white border-4 border-[#1a1a1a] flex items-center justify-center font-black text-4xl text-[#1a1a1a] shrink-0 z-10">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="z-10">
          <h2 className="text-2xl font-black uppercase leading-none">{user?.name || 'Customer'}</h2>
          <p className="font-bold text-[#1a1a1a]/70 text-sm mt-1">{user?.email || 'No email'}</p>
          <span className="mt-2 inline-block bg-[#1a1a1a] text-electricYellow text-xs font-black uppercase px-2 py-1">Customer Account</span>
        </div>
      </Card>

      {/* Info rows */}
      <Card className="divide-y-2 divide-dashed divide-gray-200 p-0">
        <div className="flex items-center gap-4 p-4">
          <User size={20} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Full Name</p>
            <p className="font-black">{user?.name || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4">
          <Mail size={20} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Email</p>
            <p className="font-black">{user?.email || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4">
          <ShieldCheck size={20} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Account Type</p>
            <p className="font-black">Customer</p>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <Card className="p-4 divide-y-2 divide-dashed divide-gray-200">
        <Link href="/portal/review" className="flex items-center justify-between py-3 font-black uppercase hover:text-blue">
          <span>Rate Recent Service</span>
          <span>→</span>
        </Link>
        <Link href="/portal/invoices" className="flex items-center justify-between py-3 font-black uppercase hover:text-blue">
          <span>View Invoices</span>
          <span>→</span>
        </Link>
      </Card>

      <button
        onClick={handleSignOut}
        className="w-full py-4 border-4 border-red text-red font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red hover:text-white transition-colors"
      >
        <LogOut size={22} strokeWidth={3} /> Sign Out
      </button>
    </div>
  );
}
