'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Printer, Mail, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('invoices')
        .select('*, work_orders(plate, customer_name, type, assigned_mechanic_id, vehicles(make, model, year, fuel), customers(phone))')
        .eq('id', id as string)
        .maybeSingle();
      setInvoice(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <Loader fullScreen />;
  if (!invoice) return <div className="p-12 text-center text-gray-500 font-black uppercase">Invoice Not Found</div>;

  const total = Number(invoice.amount) || 0;
  const discount = 0;
  const subtotal = total / 1.18;
  const gst = total - subtotal;
  
  const customerName = invoice.work_orders?.customer_name || 'Walk-in Customer';
  const customerPhone = invoice.work_orders?.customers?.phone || 'No Phone';
  const plate = invoice.work_orders?.plate || '—';
  const make = invoice.work_orders?.vehicles?.make || '—';
  const model = invoice.work_orders?.vehicles?.model || '—';
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Non-print controls */}
      <div className="flex justify-between items-center bg-cream p-4 border-neo shadow-neo print:hidden">
        <Link href="/admin/invoices">
          <Button variant="outline" className="p-2 border-2">
            <ArrowLeft size={20} className="mr-2 inline" /> Back
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white"><Mail size={16} className="mr-2" /> Email</Button>
          <Button variant="outline" className="bg-[#25D366] text-white"><Send size={16} className="mr-2" /> WhatsApp</Button>
          <Button variant="primary" onClick={() => window.print()}><Printer size={16} className="mr-2" /> Print PDF</Button>
          <Button 
            variant="outline" 
            className="bg-[#1a1a1a] text-white disabled:opacity-50"
            disabled={invoice.status === 'paid' || isProcessing}
            onClick={async () => {
              if (isProcessing || invoice.status === 'paid') return;
              setIsProcessing(true);
              const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoice.id);
              if (!error) {
                const mechanicId = invoice.work_orders?.assigned_mechanic_id;
                if (mechanicId) {
                  await supabase.from('payouts').insert({
                    staff_id: mechanicId,
                    amount: Math.floor(Number(invoice.amount) * 0.40),
                    status: 'pending'
                  });
                }
                setInvoice({ ...invoice, status: 'paid' });
                setIsProcessing(false);
              } else {
                setIsProcessing(false);
              }
            }}
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {invoice.status === 'paid' ? 'Payment Recorded' : 'Record Payment'}
          </Button>
        </div>
      </div>

      {/* Actual Print Document */}
      <Card className="p-12 bg-white print:border-none print:shadow-none min-h-[1056px] flex flex-col pt-16">
        
        {/* Header */}
        <div className="flex justify-between border-b-8 border-[#1a1a1a] pb-8 mb-8">
          <div>
            <h1 className="text-6xl font-black text-electricYellow tracking-widest uppercase transform skew-x-[-10deg] -ml-2 drop-shadow-[2px_2px_0_#1a1a1a]">GarageOS</h1>
            <p className="font-bold text-sm mt-4 uppercase tracking-wider">123 Mechanics Blvd, Auto District</p>
            <p className="font-bold text-sm uppercase tracking-wider">Mumbai, MH 400001</p>
            <p className="font-bold text-sm uppercase tracking-wider">GSTIN: 27AAAAA0000A1Z5</p>
            <p className="font-bold text-sm uppercase tracking-wider">+91 98765 43210</p>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <h2 className="text-4xl font-black uppercase mb-4 tracking-widest text-[#1a1a1a]">TAX INVOICE</h2>
            <div className="bg-[#1a1a1a] text-white p-4 border-l-[12px] border-electricYellow min-w-[250px] text-left">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">Invoice #</span>
                <span className="font-mono font-black">{id}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">Date</span>
                <span className="font-mono font-black">{new Date(invoice.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">Due Date</span>
                <span className="font-mono font-black text-orange">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Receipt'}</span>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant={invoice.status === 'paid' ? 'ready' : invoice.status === 'overdue' ? 'overdue' : 'waiting'} className="text-lg px-4 py-2 border-4 shadow-[4px_4px_0_#1a1a1a]">
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Bill To & Vehicle details */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="font-black border-b-4 border-[#1a1a1a] pb-1 mb-2 uppercase tracking-widest inline-block text-gray-500">Billed To</h3>
            <p className="text-2xl font-black uppercase tracking-wider">{customerName}</p>
            <p className="font-bold text-sm uppercase mt-1">Contact: {customerPhone}</p>
            <p className="font-bold text-sm uppercase text-gray-400">Address on File</p>
          </div>
          <div>
            <h3 className="font-black border-b-4 border-[#1a1a1a] pb-1 mb-2 uppercase tracking-widest inline-block text-gray-500">Vehicle Serviced</h3>
            <div>
              <span className="bg-electricYellow text-[#1a1a1a] px-3 py-1 font-mono tracking-widest border-neo font-black text-xl inline-block mb-2">
                {plate}
              </span>
            </div>
            <p className="font-bold text-sm uppercase mt-1">{make} {model}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left border-collapse border-4 border-[#1a1a1a] mb-12">
          <thead>
            <tr className="bg-[#1a1a1a] text-white h-12">
              <th className="p-3 font-black uppercase tracking-widest text-sm border-2 border-[#1a1a1a] w-12 text-center">#</th>
              <th className="p-3 font-black uppercase tracking-widest text-sm border-2 border-[#1a1a1a]">Description</th>
              <th className="p-3 font-black uppercase tracking-widest text-sm border-2 border-[#1a1a1a] w-24 text-center">Qty</th>
              <th className="p-3 font-black uppercase tracking-widest text-sm border-2 border-[#1a1a1a] w-32 text-right">Unit Price</th>
              <th className="p-3 font-black uppercase tracking-widest text-sm border-2 border-[#1a1a1a] w-32 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="font-bold uppercase text-sm">
            <tr className="bg-gray-100 border-2 border-[#1a1a1a]">
              <td colSpan={5} className="p-2 px-3 font-black text-gray-500 tracking-widest">Services Rendered</td>
            </tr>
            <tr className="border-2 border-[#1a1a1a]">
              <td className="p-3 border-r-2 border-[#1a1a1a] text-center">1</td>
              <td className="p-3 border-r-2 border-[#1a1a1a]">{invoice.work_orders?.type || 'General Service & Spares'}</td>
              <td className="p-3 border-r-2 border-[#1a1a1a] text-center">1</td>
              <td className="p-3 border-r-2 border-[#1a1a1a] text-right">{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              <td className="p-3 border-r-2 border-[#1a1a1a] text-right">{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-between items-end mt-auto">
          <div className="w-1/2">
            <h4 className="font-black uppercase tracking-widest border-b-2 border-[#1a1a1a] mb-2 inline-block">Payment Instructions</h4>
            <p className="font-bold text-sm uppercase text-gray-600 mb-1">Bank Transfer: GarageOS Pvt Ltd</p>
            <p className="font-bold text-sm uppercase text-gray-600 font-mono">A/C: 12345678901234  |  IFSC: HDFC0001234</p>
            <p className="font-bold text-sm uppercase text-gray-600 mt-4">UPI: garageos@upi</p>
          </div>
          
          <div className="w-1/3 border-4 border-[#1a1a1a] bg-cream pt-2">
            <div className="flex justify-between px-4 py-2 font-bold uppercase border-b-2 border-dashed border-gray-400">
              <span>Subtotal</span>
              <span>₹ {subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between px-4 py-2 font-bold uppercase border-b-2 border-dashed border-gray-400 text-gray-600">
              <span>Discount</span>
              <span>- ₹ {discount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between px-4 py-2 font-bold uppercase border-b-2 border-[#1a1a1a]">
              <span>GST (18%)</span>
              <span>₹ {gst.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between px-4 py-4 bg-electricYellow text-[#1a1a1a] font-black text-2xl uppercase tracking-widest border-t-[8px] border-[#1a1a1a]">
              <span>Total</span>
              <span>₹ {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center border-t-4 border-[#1a1a1a] border-dashed pt-4 font-bold text-xs uppercase tracking-widest text-gray-400">
          Thank you for choosing GarageOS!
        </div>
      </Card>
    </div>
  );
}
