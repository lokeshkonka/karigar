'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [method, setMethod] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect to role-select so users tell us if they're a mechanic or customer
        redirectTo: `${window.location.origin}/role-select`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method !== 'email') {
      toast.error('OTP login is not configured yet');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.session) {
      toast.success('Login Successful');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      {/* Logo Header */}
      <div className="mb-8 transform -rotate-2">
        <Image src="/icon-name.png" alt="Karigar" width={220} height={70} priority />
      </div>

      <Card className="w-full max-w-md p-8 transform rotate-1">
        <h2 className="text-3xl font-black uppercase text-[#1a1a1a] mb-8 text-center leading-tight">
          Sign In To<br />Your Garage
        </h2>

        <div className="flex gap-2 mb-6">
          <Button 
            variant={method === 'email' ? 'primary' : 'outline'} 
            className="flex-1 text-sm py-2"
            onClick={() => setMethod('email')}
            type="button"
          >
            Email
          </Button>
          <Button 
            variant={method === 'otp' ? 'primary' : 'outline'} 
            className="flex-1 text-sm py-2"
            onClick={() => setMethod('otp')}
            type="button"
          >
            OTP (Phone)
          </Button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {method === 'email' ? (
            <>
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="mechanic@garage.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          ) : (
            <>
              <Input 
                 label="Phone Number" 
                 type="tel" 
                 placeholder="+91 98765 43210" 
                 value={phone}
                 onChange={(e) => setPhone(e.target.value)}
                 required 
              />
            </>
          )}

          <div className="flex justify-end">
            <Link href="#" className="text-sm font-bold text-blue hover:underline uppercase tracking-wide">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2 text-lg">
            {loading ? 'Authenticating...' : method === 'email' ? 'Sign In' : 'Send OTP code'}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-1 flex-1 bg-[#1a1a1a]"></div>
          <span className="font-bold text-sm uppercase">OR</span>
          <div className="h-1 flex-1 bg-[#1a1a1a]"></div>
        </div>

        <Button 
          variant="secondary" 
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-3 bg-[#1a1a1a] text-white"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
          {loading ? 'REDIRECTING TO GOOGLE...' : 'SIGN IN WITH GOOGLE'}
        </Button>

        <p className="mt-8 text-center font-bold text-sm">
          NEW CUSTOMER?{' '}
          <Link href="/register" className="text-electricYellow bg-[#1a1a1a] px-2 py-1 ml-1 hover:text-white transition-colors">
            REGISTER HERE
          </Link>
        </p>
      </Card>
    </div>
  );
}
