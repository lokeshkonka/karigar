'use client';

import { supabase } from '@/lib/supabase';
import React, { FormEvent, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { downloadInvoiceHtml, formatCurrency, getInvoiceViewModel, InvoiceDocumentRow } from '@/lib/invoiceDocument';
import { Plus, Search, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkOrderOption {
  id: string;
  customer_id: string | null;
  customerName: string;
  plate: string;
  type: string;
}

interface WorkOrderQueryRow {
  id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  plate?: string | null;
  type?: string | null;
  customers?: { name?: string | null } | { name?: string | null }[] | null;
  vehicles?: { plate?: string | null } | { plate?: string | null }[] | null;
}

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<InvoiceDocumentRow[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  async function fetchInvoices() {
    const { data, error } = await supabase.from('invoices').select(`
      id, amount, status, created_at, due_date,
      customers ( name, phone, email ),
      work_orders (
        id, plate, customer_name, type, issue_description, notes,
        customers ( name, phone, email ),
        vehicles ( plate, make, model, year, fuel )
      )
    `).order('created_at', { ascending: false });

    if (error) {
      toast.error('Unable to load invoices');
    } else {
      setInvoices((data || []) as InvoiceDocumentRow[]);
    }
    setLoading(false);
  }

  async function fetchWorkOrders() {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        id, customer_id, customer_name, plate, type,
        customers ( name ),
        vehicles ( plate )
      `)
      .order('created_at', { ascending: false });

    if (error) return;

    setWorkOrders(((data || []) as WorkOrderQueryRow[]).map((order) => {
      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
      const vehicle = Array.isArray(order.vehicles) ? order.vehicles[0] : order.vehicles;

      return {
        id: order.id,
        customer_id: order.customer_id || null,
        customerName: customer?.name || order.customer_name || 'Walk-in Customer',
        plate: order.plate || vehicle?.plate || 'No plate',
        type: order.type || 'Service',
      };
    }));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchInvoices();
      fetchWorkOrders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const visibleInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return invoices;

    return invoices.filter((invoice) => {
      const vm = getInvoiceViewModel(invoice);
      return [
        vm.id,
        vm.shortId,
        vm.customerName,
        vm.plate,
        vm.serviceType,
        vm.status,
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [invoices, search]);

  const handleCreateInvoice = async (event: FormEvent) => {
    event.preventDefault();
    const selectedWorkOrder = workOrders.find((order) => order.id === selectedWorkOrderId);
    const parsedAmount = Number(amount);

    if (!selectedWorkOrder) {
      toast.error('Select a work order');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid invoice amount');
      return;
    }

    setCreating(true);
    const { error } = await supabase.from('invoices').insert({
      work_order_id: selectedWorkOrder.id,
      customer_id: selectedWorkOrder.customer_id,
      amount: parsedAmount,
      status: 'pending',
      due_date: dueDate || null,
    });
    setCreating(false);

    if (error) {
      toast.error('Unable to add invoice');
      return;
    }

    toast.success('Invoice added');
    setShowAddInvoice(false);
    setSelectedWorkOrderId('');
    setAmount('');
    setDueDate('');
    fetchInvoices();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">
            Billing & Invoices
          </h1>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setShowAddInvoice(true)}>
          <Plus size={18} strokeWidth={3} />
          Add Invoice
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex-1 relative">
          <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a] mb-1 block">Search</label>
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border-neo focus:outline-none focus:ring-2 focus:ring-electricYellow" 
              placeholder="Search by Invoice #, Customer, or Plate..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
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
              ) : visibleInvoices.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center font-bold text-gray-500">No invoices.</td></tr>
              ) : visibleInvoices.map((invoice, i) => {
                const inv = getInvoiceViewModel(invoice);

                return (
                  <tr key={inv.id} className={`border-2 border-[#1a1a1a] font-bold ${i % 2 === 0 ? 'bg-white' : 'bg-cream'} ${inv.status === 'overdue' ? 'border-l-[8px] border-l-red' : ''}`}>
                    <td className="p-4 border-r-2 border-[#1a1a1a]">
                      <span className="font-mono bg-electricYellow px-2 py-1 tracking-widest border-neo border-2 text-xs max-w-[150px] block overflow-hidden text-ellipsis">
                        {inv.shortId}
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-[#1a1a1a]">
                      <div className="flex flex-col">
                        <span>{inv.customerName}</span>
                        <span className="text-xs font-black text-gray-500 tracking-widest uppercase">{inv.plate}</span>
                      </div>
                    </td>
                    <td className="p-4 border-r-2 border-[#1a1a1a]">{inv.date}</td>
                    <td className="p-4 border-r-2 border-[#1a1a1a] font-black text-lg">{formatCurrency(inv.total)}</td>
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
                        <Link
                          href={`/admin/invoices/${inv.id}`}
                          className="px-3 py-2 font-black uppercase tracking-wider text-xs transition-transform active:translate-x-[2px] active:translate-y-[2px] bg-transparent text-[#1a1a1a] shadow-neo-sm hover:bg-cream border-neo inline-flex items-center"
                        >
                          View
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          className="px-3 py-2 border-neo hover:bg-cream"
                          title="Download invoice"
                          onClick={() => downloadInvoiceHtml(invoice)}
                        >
                          <Download size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddInvoice && (
        <div className="fixed inset-0 z-[80] bg-black/50 p-4 flex items-center justify-center">
          <Card className="bg-white w-full max-w-xl p-6 relative">
            <button
              type="button"
              onClick={() => setShowAddInvoice(false)}
              className="absolute right-4 top-4 p-2 hover:bg-cream border-2 border-transparent hover:border-[#1a1a1a]"
              aria-label="Close add invoice"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black uppercase tracking-widest text-[#1a1a1a] mb-6">Add Invoice</h2>
            <form className="space-y-5" onSubmit={handleCreateInvoice}>
              <div>
                <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a] mb-1 block">Work Order</label>
                <select
                  className="w-full px-4 py-3 bg-white border-neo focus:outline-none focus:ring-2 focus:ring-electricYellow font-bold"
                  value={selectedWorkOrderId}
                  onChange={(event) => setSelectedWorkOrderId(event.target.value)}
                  required
                >
                  <option value="">Select work order</option>
                  {workOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.plate} - {order.customerName} - {order.type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a] mb-1 block">Amount</label>
                  <input
                    className="w-full px-4 py-3 bg-white border-neo focus:outline-none focus:ring-2 focus:ring-electricYellow font-bold"
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a] mb-1 block">Due Date</label>
                  <input
                    className="w-full px-4 py-3 bg-white border-neo focus:outline-none focus:ring-2 focus:ring-electricYellow font-bold"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={creating}>
                <Plus size={18} strokeWidth={3} />
                {creating ? 'Adding...' : 'Add Invoice'}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
