'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import { Car, Box, ShieldCheck, ArrowRight, Star, Gauge, Zap } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-cream selection:bg-electricYellow selection:text-[#1a1a1a] flex flex-col font-sans">

      {/* Navbar */}
      <nav className="border-b-4 border-[#1a1a1a] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/icon-name.png" alt="Karigar" width={160} height={56} className="mt-0.5" />
          </div>
          <div className="hidden md:flex gap-8 font-black uppercase tracking-wider text-sm items-center">
            <Link href="#features" className="hover:text-blue hover:underline decoration-4 underline-offset-4">Features</Link>
            <Link href="#pricing" className="hover:text-orange hover:underline decoration-4 underline-offset-4">Pricing</Link>
            {user ? (
               <Link href={user.role === 'CUSTOMER' ? '/portal/home' : user.role === 'TECHNICIAN' ? '/staff/dashboard' : '/admin/dashboard'}>
                 <Button variant="primary" className="px-6 py-2 shadow-neo-sm border-2 font-black">Go to Dashboard</Button>
               </Link>
            ) : (
               <>
                 <Link href="/login">
                   <Button variant="outline" className="px-6 py-2 shadow-neo-sm border-2">Sign In</Button>
                 </Link>
                 <Link href="/register">
                   <Button variant="primary" className="px-6 py-2 shadow-neo-sm border-2 font-black">Register Garage</Button>
                 </Link>
               </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex-1 max-w-7xl mx-auto px-6 py-20 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#1a1a1a] text-electricYellow font-black uppercase tracking-widest px-4 py-1.5 text-sm border-neo transform rotate-2">
            <Zap size={14} fill="currentColor" /> The Ultimate Workshop Engine
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase text-[#1a1a1a] leading-[1.05] tracking-tight">
            Run Your<br/>
            <span className="bg-electricYellow px-2 border-y-4 border-[#1a1a1a]">Karigar</span><br/>
            Like a Pro.
          </h1>
          <p className="text-xl md:text-2xl font-bold text-gray-700 max-w-lg leading-relaxed">
            Ditch the clipboards. Track work orders, manage inventory, and delight customers — all in one sharp platform built for Indian garages.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/register">
              <Button variant="primary" className="w-full sm:w-auto text-xl px-10 py-5 rounded-none flex items-center gap-3 group">
                Start Free Trial
                <ArrowRight className="group-hover:translate-x-2 transition-transform" strokeWidth={3} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full sm:w-auto text-xl px-10 py-5 bg-white">
                Mechanic Login
              </Button>
            </Link>
          </div>

          {/* Stat strip */}
          <div className="flex gap-6 pt-2">
            {[['10K+', 'Garages'], ['₹ 40%', 'Rev Boost'], ['24/7', 'Uptime']].map(([val, lbl]) => (
              <div key={lbl} className="flex flex-col">
                <span className="text-2xl font-black text-[#1a1a1a]">{val}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geometric Hero Illustration */}
        <div className="relative h-[520px] w-full hidden md:block">
          {/* Brand icon large */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#1a1a1a] border-neo shadow-[14px_14px_0px_#F5C800] flex items-center justify-center transform hover:rotate-3 transition-transform duration-300 overflow-hidden">
            <Image src="/icon.png" alt="Karigar Icon" width={220} height={220} className="object-contain" />
          </div>
          {/* Revenue card */}
          <div className="absolute bottom-16 left-0 w-80 h-48 bg-electricYellow border-neo shadow-[12px_12px_0px_#1a1a1a] flex flex-col items-center justify-center transform -rotate-6 z-20">
            <h3 className="font-black text-3xl uppercase tracking-widest mb-2">Revenue</h3>
            <span className="text-5xl font-black border-b-4 border-[#1a1a1a] pb-1">₹ 2.4 L</span>
          </div>
          {/* Bounce badge */}
          <div className="absolute top-64 left-8 w-28 h-28 bg-orange border-neo shadow-[8px_8px_0px_#1a1a1a] rounded-full flex flex-col items-center justify-center z-10 animate-[bounce_3s_ease-in-out_infinite]">
            <Gauge size={40} color="white" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest mt-1">Live</span>
          </div>
          {/* Decorative dot grid */}
          <div className="absolute bottom-0 right-0 w-24 h-24 grid grid-cols-4 gap-2 opacity-30">
            {Array.from({length:16}).map((_,i)=>(
              <div key={i} className="w-2 h-2 bg-[#1a1a1a] rounded-full" />
            ))}
          </div>
        </div>
      </header>

      {/* Marquee ribbon */}
      <div className="bg-[#1a1a1a] border-y-4 border-[#1a1a1a] overflow-hidden whitespace-nowrap py-4">
        <div className="inline-block animate-[marquee_20s_linear_infinite] font-black text-electricYellow text-2xl uppercase tracking-[0.2em]">
          TRUSTED BY 10,000+ GARAGES WORLDWIDE • MORE CARS FIXED • ZERO HEADACHES • BOOST PROFITS BY 40% •&nbsp;
          TRUSTED BY 10,000+ GARAGES WORLDWIDE • MORE CARS FIXED • ZERO HEADACHES • BOOST PROFITS BY 40% •&nbsp;
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-black uppercase text-[#1a1a1a] inline-block bg-cream border-neo px-6 py-2 shadow-neo-lg transform -rotate-1">
              Absolute Control.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:-translate-y-2 transition-transform bg-electricYellow border-[#1a1a1a]">
              <div className="bg-white border-neo w-16 h-16 flex items-center justify-center mb-6 shadow-neo-sm">
                <Car size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-4">Live 3D Floorplan</h3>
              <p className="font-bold text-gray-800 leading-relaxed">
                Visualize every bay in your garage in beautiful 3D WebGL. See which cars are overdue, idle, or completely ready instantly.
              </p>
            </Card>
            <Card className="p-8 hover:-translate-y-2 transition-transform bg-blue text-[#1a1a1a] border-[#1a1a1a]">
              <div className="bg-white border-neo w-16 h-16 flex items-center justify-center mb-6 shadow-neo-sm text-[#1a1a1a]">
                <Box size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-4">Stock Pulser</h3>
              <p className="font-bold leading-relaxed text-[#1a1a1a]">
                A massive rigid Kanban board and inventory grid tracks every nut and bolt. Flashing red metrics prevent you from running out.
              </p>
            </Card>
            <Card className="p-8 hover:-translate-y-2 transition-transform bg-orange text-[#1a1a1a] border-[#1a1a1a]">
              <div className="bg-white border-neo w-16 h-16 flex items-center justify-center mb-6 shadow-neo-sm text-[#1a1a1a]">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-4">Permission Shield</h3>
              <p className="font-bold leading-relaxed text-[#1a1a1a]">
                Strict mechanic boundaries. Role-Based Access logic ensures mechanics only see tablet-views, and admins see all revenue stats.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-cream border-t-4 border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-black text-center uppercase mb-16">Pricing that Drives Growth</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
             <Card className="p-0 border-[#1a1a1a] bg-white flex flex-col">
               <div className="p-8 border-b-4 border-[#1a1a1a] bg-gray-100">
                 <h3 className="text-2xl font-black uppercase tracking-widest text-gray-500 mb-2">Starter</h3>
                 <p className="text-5xl font-black">₹ 1499<span className="text-xl text-gray-400">/mo</span></p>
               </div>
               <div className="p-8 flex-1 flex flex-col">
                 <ul className="space-y-4 font-bold text-lg mb-8 flex-1">
                   <li className="flex items-center gap-2"><Star size={20} className="text-electricYellow fill-electricYellow" /> Up to 3 Bays</li>
                   <li className="flex items-center gap-2"><Star size={20} className="text-electricYellow fill-electricYellow" /> 5 Mechanic Accounts</li>
                   <li className="flex items-center gap-2"><Star size={20} className="text-electricYellow fill-electricYellow" /> Standard Invoicing</li>
                 </ul>
                 <Button className="w-full text-xl py-4" variant="outline">Start Trial</Button>
               </div>
             </Card>
             <Card className="p-0 border-[#1a1a1a] bg-electricYellow flex flex-col transform md:-translate-y-4 relative z-10">
               <div className="absolute top-0 right-0 bg-[#1a1a1a] text-white px-3 py-1 font-black uppercase text-xs tracking-widest transform translate-x-2 -translate-y-2 border-2 border-white">
                 Most Popular
               </div>
               <div className="p-8 border-b-4 border-[#1a1a1a] bg-electricYellow">
                 <h3 className="text-2xl font-black uppercase tracking-widest text-[#1a1a1a] mb-2">Pro Shop</h3>
                 <p className="text-5xl font-black">₹ 3999<span className="text-xl opacity-70">/mo</span></p>
               </div>
               <div className="p-8 flex-1 flex flex-col bg-white">
                 <ul className="space-y-4 font-bold text-lg mb-8 flex-1">
                   <li className="flex items-center gap-2"><Star size={20} className="text-electricYellow fill-electricYellow" /> Unlimited Bays & Accounts</li>
                   <li className="flex items-center gap-2"><Star size={20} className="text-electricYellow fill-electricYellow" /> 3D Floorplan Viewer</li>
                   <li className="flex items-center gap-2"><Star size={20} className="text-electricYellow fill-electricYellow" /> Inventory Re-Order Alerts</li>
                   <li className="flex items-center gap-2"><Star size={20} className="text-electricYellow fill-electricYellow" /> WhatsApp Cloud Receipt API</li>
                 </ul>
                 <Button className="w-full text-xl py-4" variant="primary">Dominate the Market</Button>
               </div>
             </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12 border-t-8 border-electricYellow">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/icon-name.png" alt="Karigar" width={140} height={48} className="brightness-200 invert" />
          </div>
          <div className="font-bold text-sm tracking-widest text-gray-400">
            © 2026 KARIGAR GARAGE SOLUTIONS. ALL RIGHTS STRICTLY RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
