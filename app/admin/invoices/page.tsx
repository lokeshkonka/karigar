'use client';

import { supabase } from '@/lib/supabase';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Filter, Download } from 'lucide-react';

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    const { data } = await supabase.from('invoices').select(`
      id, amount, status, created_at,
      customers ( name ),
      work_orders ( vehicles ( plate ) )
    `).order('created_at', { ascending: false });

    if (data) {
      setInvoices(data.map((inv: any) => ({
        id: inv.id, // Or keep UUID
        customer: inv.customers?.name || 'Unknown',
        plate: inv.work_orders?.vehicles?.[0]?.plate || inv.work_orders?.vehicles?.plate || '-',
        date: new Date(inv.created_at).toLocaleDateString(),
        amount: inv.amount,
        status: inv.status
      })));
    }
    setLoading(false);
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">
            Billing & Invoices
          </h1>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={18} strokeWidth={3} />
          Create Invoice
        </Button>
      </div>

      <div className="flex gap-4 items-end mb-6">
        <div className="flex-1 relative">
          <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a] mb-1 block">Search</label>
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border-neo focus:outline-none focus:ring-2 focus:ring-electricYellow" 
              placeholder="Search by Invoice #, Customer, or Plate..."
            />
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2 py-3">
          <Filter size={18} /> Filters
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1a1a1a] text-white">
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Invoice #</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Customer</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Date</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Amount</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Status</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center font-bold">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center font-bold text-gray-500">No invoices.</td></tr>
              ) : invoices.map((inv, i) => (
                <tr key={inv.id} className={`border-2 border-[#1a1a1a] font-bold ${i % 2 === 0 ? 'bg-white' : 'bg-cream'} ${inv.status === 'overdue' ? 'border-l-[8px] border-l-red' : ''}`}>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">
                    <span className="font-mono bg-electricYellow px-2 py-1 tracking-widest border-neo border-2 text-xs truncate max-w-[120px] block">
                      {inv.id}
                    </span>
                  </td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">
                    <div className="flex flex-col">
                      <span>{inv.customer}</span>
                      <span className="text-xs font-black text-gray-500 tracking-widest uppercase">{inv.plate}</span>
                    </div>
                  </td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">{inv.date}</td>
                  <td className="p-4 border-r-2 border-[#1a1a1a] font-black text-lg">₹ {inv.amount.toLocaleString()}</td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">
                    <Badge variant={
                      inv.status === 'paid' ? 'ready' : 
                      inv.status === 'pending' ? 'waiting' : 
                      inv.status === 'overdue' ? 'overdue' : 'default'
                    }>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link href={`/admin/invoices/${inv.id}`}>
                        <Button variant="outline" className="px-3 py-1 text-xs">View</Button>
                      </Link>
                      <Button variant="outline" className="px-2 py-1 border-neo hover:bg-cream">
                        <Download size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
