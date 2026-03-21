'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'OWNER' || user.role === 'MANAGER') {
        router.push('/admin/dashboard');
      } else if (user.role === 'TECHNICIAN') {
        router.push('/staff/dashboard');
      } else {
        router.push('/portal/home');
      }
    }
  }, [user, isLoading, router]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuel, setFuel] = useState('Petrol');

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role: 'CUSTOMER' }
      }
    });

    if (error || !authData.user) {
      setLoading(false);
      toast.error(error?.message || 'Failed to create user');
      return;
    }

    // Insert customer row directly
    const { data: customerData, error: custErr } = await supabase.from('customers').insert({
      user_id: authData.user.id,
      email: email,
      name: name,
      phone: phone
    }).select().single();

    if (customerData && !custErr) {
      // Also register their first vehicle
      await supabase.from('vehicles').insert({
        customer_id: customerData.id,
        make, model, year: parseInt(year) || 2020, plate, fuel, color: '#1a1a1a'
      });
    }

    setLoading(false);
    toast.success('Account & Vehicle created successfully!');
    router.replace('/portal/home');
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 py-12">
      <div className="mb-8 transform -rotate-1">
        <Image src="/icon-name.png" alt="Karigar" width={220} height={70} priority />
      </div>

      <Card className="w-full max-w-2xl p-8">
        <h2 className="text-3xl font-black uppercase text-[#1a1a1a] mb-2 border-b-4 border-[#1a1a1a] pb-2">
          New Customer Registration
        </h2>
        <p className="font-bold mb-8 text-gray-600">Create an account to track your vehicle's service history.</p>

        <form onSubmit={handleRegister} className="flex flex-col gap-8">
          
          <div className="bg-electricYellow p-6 border-neo transform rotate-1 mb-4 flex flex-col items-center justify-center gap-4">
            <h3 className="text-xl font-black uppercase text-center w-full">Fastest Way to Start</h3>
            <Button 
              type="button" 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full bg-[#1a1a1a] text-white py-4 flex items-center justify-center gap-3 hover:bg-white hover:text-[#1a1a1a] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              {loading ? 'REDIRECTING...' : 'CONTINUE WITH GOOGLE'}
            </Button>
            <p className="font-bold text-xs uppercase text-gray-700">Skips email verification hurdles</p>
          </div>

          <div className="flex items-center gap-4 mb-2">
            <div className="h-1 flex-1 bg-[#1a1a1a]"></div>
            <span className="font-black tracking-widest uppercase text-sm">OR USE EMAIL</span>
            <div className="h-1 flex-1 bg-[#1a1a1a]"></div>
          </div>

          {/* Section 1: Personal Details */}
          <div>
            <h3 className="text-xl font-black uppercase bg-electricYellow inline-block px-2 py-1 border-neo-sm mb-4">
              1. Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
              <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required />
              <Input label="Email Address" type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          {/* Section 2: Vehicle Details */}
          <div>
            <h3 className="text-xl font-black uppercase bg-blue text-white inline-block px-2 py-1 border-neo-sm mb-4">
              2. Vehicle Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Registration Plate" placeholder="MH 01 AB 1234" className="font-mono text-center text-lg bg-electricYellow" value={plate} onChange={e => setPlate(e.target.value)} required />
              <Input label="Make / Brand" placeholder="Hyundai" value={make} onChange={e => setMake(e.target.value)} required />
              <Input label="Model" placeholder="i20" value={model} onChange={e => setModel(e.target.value)} required />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Year" type="number" placeholder="2021" value={year} onChange={e => setYear(e.target.value)} required />
                <div className="flex flex-col gap-1 w-full">
                  <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a]">
                    Fuel Type
                  </label>
                  <select 
                    className="px-4 py-3 bg-white border-neo text-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow focus:border-electricYellow h-[52px]"
                    value={fuel}
                    onChange={e => setFuel(e.target.value)}
                  >
                    <option>Petrol</option>
                    <option>Diesel</option>
                    <option>EV</option>
                    <option>CNG</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full text-xl mt-4 py-4 uppercase">
            {loading ? 'Registering...' : 'Register Account & Vehicle'}
          </Button>
        </form>

        <p className="mt-8 text-center font-bold text-sm">
          ALREADY HAVE AN ACCOUNT?{' '}
          <Link href="/login" className="text-blue hover:underline uppercase tracking-wide ml-1">
            SIGN IN HERE
          </Link>
        </p>
      </Card>
    </div>
  );
}
