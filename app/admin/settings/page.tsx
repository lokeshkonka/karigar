'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const handleSave = () => {
    toast.success('Settings Saved Successfully!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">
            Global Settings
          </h1>
          <p className="font-bold text-gray-600 mt-2 tracking-wider">SYSTEM CONFIGURATION</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2 px-8 py-3 bg-electricYellow border-neo shadow-neo shadow-[#1a1a1a] text-[#1a1a1a]">
          <Save size={18} strokeWidth={3} /> Save Changes
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 border-b-4 lg:border-b-0 lg:border-r-4 border-[#1a1a1a] lg:pr-6">
          <Button 
            variant={activeTab === 'general' ? 'primary' : 'outline'} 
            className="justify-start shrink-0"
            onClick={() => setActiveTab('general')}
          >
            <ShieldCheck size={18} className="mr-2" /> General Config
          </Button>
          <Button 
            variant={activeTab === 'billing' ? 'primary' : 'outline'} 
            className="justify-start shrink-0"
            onClick={() => setActiveTab('billing')}
          >
            <Zap size={18} className="mr-2" /> Billing & Taxes
          </Button>
          <Button 
            variant={activeTab === 'danger' ? 'primary' : 'outline'} 
            className={`justify-start shrink-0 ${activeTab === 'danger' ? 'bg-red text-[#1a1a1a] border-red' : 'text-red border-red hover:bg-red/10'}`}
            onClick={() => setActiveTab('danger')}
          >
            <AlertTriangle size={18} className="mr-2" /> Danger Zone
          </Button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 min-w-0">
          
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95">
              <Card className="p-8">
                <h3 className="text-2xl font-black uppercase mb-6 border-l-4 border-electricYellow pl-4">Business Profile</h3>
                <div className="space-y-6">
                  <Input label="Garage Name" defaultValue="Metro Auto Works" />
                  <Input label="Support Email" defaultValue="support@metroauto.in" type="email" />
                  <Input label="Contact Phone" defaultValue="+91 98765 43210" type="tel" />
                  <div className="flex flex-col gap-1 w-full">
                    <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a]">Business Address</label>
                    <textarea 
                      className="w-full p-4 bg-white border-neo text-[#1a1a1a] font-bold min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-electricYellow"
                      defaultValue={`123 Industrial Estate\nAndheri East, Mumbai 400059`}
                    />
                  </div>
                </div>
              </Card>
              
              <Card className="p-8">
                <h3 className="text-2xl font-black uppercase mb-6 border-l-4 border-blue pl-4">Operating Hours</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-sm uppercase text-gray-500">Opening Time</label>
                    <input type="time" defaultValue="09:00" className="p-3 border-2 border-[#1a1a1a] font-black text-xl bg-cream" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-sm uppercase text-gray-500">Closing Time</label>
                    <input type="time" defaultValue="19:00" className="p-3 border-2 border-[#1a1a1a] font-black text-xl bg-cream" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95">
              <Card className="p-8">
                <h3 className="text-2xl font-black uppercase mb-6 border-l-4 border-green pl-4">Tax Configuration</h3>
                <div className="space-y-6">
                  <Input label="GSTIN Number" defaultValue="27AADCB2230M1Z2" className="font-mono uppercase" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Default SGST (%)" defaultValue="9" type="number" />
                    <Input label="Default CGST (%)" defaultValue="9" type="number" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-8">
                <h3 className="text-2xl font-black uppercase mb-6 border-l-4 border-orange pl-4">Invoice Generation</h3>
                <div className="space-y-6">
                  <Input label="Invoice Prefix" defaultValue="INV-MAW-" className="font-mono" />
                  <Input label="Bank Account Number" defaultValue="000123456789" type="number" />
                  <Input label="IFSC Code" defaultValue="HDFC0001234" className="font-mono uppercase" />
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95">
              <Card className="p-8 border-4 border-red bg-red/5">
                <h3 className="text-2xl font-black uppercase mb-2 text-red flex items-center gap-3">
                  <AlertTriangle size={28} strokeWidth={3} /> Factory Reset
                </h3>
                <p className="font-bold text-gray-600 mb-6 max-w-lg">
                  This action will permanently purge all Work Orders, Customers, and Invoices from the Supabase Postgres cluster. 
                  This cannot be undone.
                </p>
                <Button className="bg-red text-[#1a1a1a] border-red shadow-none hover:bg-red/90 uppercase tracking-widest font-black py-4">
                  Purge Database
                </Button>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
