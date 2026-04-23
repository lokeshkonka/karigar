'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Printer, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Loader } from '@/components/ui/Loader';
import {
  downloadLedgerCsv,
  formatReportCurrency,
  LedgerRow,
  printReportLedger,
  ReportKpis,
  RevenuePoint,
  ServiceSplitPoint,
} from '@/lib/reportDocument';
import toast from 'react-hot-toast';

type Related<T> = T | T[] | null | undefined;

interface InvoiceQueryRow {
  id: string;
  amount: number | string | null;
  status: string | null;
  created_at: string | null;
  customers?: Related<{ name?: string | null }>;
  work_orders?: Related<{
    plate?: string | null;
    customer_name?: string | null;
    type?: string | null;
    customers?: Related<{ name?: string | null }>;
    vehicles?: Related<{ plate?: string | null }>;
  }>;
}

interface PayoutQueryRow {
  amount: number | string | null;
  status: string | null;
}

interface WorkOrderQueryRow {
  type: string | null;
}

const EMPTY_KPIS: ReportKpis = {
  gross: 0,
  expenses: 0,
  net: 0,
  margin: 0,
  paidInvoices: 0,
  pendingAmount: 0,
  overdueAmount: 0,
};

const COLORS = ['#111827', '#3B8BD4', '#639922', '#EF9F27', '#E24B4A', '#6b7280'];

const getOne = <T,>(value: Related<T>): T | undefined => {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
};

const formatDate = (value: string | null) => {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getLedgerRow = (invoice: InvoiceQueryRow): LedgerRow => {
  const workOrder = getOne(invoice.work_orders);
  const directCustomer = getOne(invoice.customers);
  const workOrderCustomer = getOne(workOrder?.customers);
  const vehicle = getOne(workOrder?.vehicles);

  return {
    id: invoice.id,
    date: formatDate(invoice.created_at),
    customer: directCustomer?.name || workOrderCustomer?.name || workOrder?.customer_name || 'Walk-in Customer',
    plate: workOrder?.plate || vehicle?.plate || 'No plate',
    service: workOrder?.type || 'General service',
    status: (invoice.status || 'pending').toLowerCase(),
    amount: Number(invoice.amount) || 0,
  };
};

const getDaysAgo = (value: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;

  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
};

const buildRevenueData = (invoices: InvoiceQueryRow[]): RevenuePoint[] => {
  const current = [0, 0, 0, 0];
  const previous = [0, 0, 0, 0];

  invoices.forEach((invoice) => {
    if ((invoice.status || '').toLowerCase() !== 'paid') return;

    const daysAgo = getDaysAgo(invoice.created_at);
    const amount = Number(invoice.amount) || 0;

    if (daysAgo >= 0 && daysAgo < 28) {
      const bucket = 3 - Math.floor(daysAgo / 7);
      current[bucket] += amount;
    } else if (daysAgo >= 28 && daysAgo < 56) {
      const bucket = 3 - Math.floor((daysAgo - 28) / 7);
      previous[bucket] += amount;
    }
  });

  return ['Week -3', 'Week -2', 'Week -1', 'This Week'].map((name, index) => ({
    name,
    current: current[index],
    previous: previous[index],
  }));
};

const buildServiceSplit = (workOrders: WorkOrderQueryRow[]): ServiceSplitPoint[] => {
  const counts = workOrders.reduce<Record<string, number>>((acc, order) => {
    const key = order.type || 'General';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const split = Object.entries(counts).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length],
  }));

  return split.length > 0 ? split : [{ name: 'No Data', value: 1, color: '#111827' }];
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [serviceSplit, setServiceSplit] = useState<ServiceSplitPoint[]>([]);
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([]);
  const [kpis, setKpis] = useState<ReportKpis>(EMPTY_KPIS);
  const [generatedAt, setGeneratedAt] = useState('');

  async function loadStats() {
    const [invoiceResult, payoutResult, workOrderResult] = await Promise.all([
      supabase
        .from('invoices')
        .select(`
          id, amount, status, created_at,
          customers ( name ),
          work_orders (
            plate, customer_name, type,
            customers ( name ),
            vehicles ( plate )
          )
        `)
        .order('created_at', { ascending: false }),
      supabase.from('payouts').select('amount, status'),
      supabase.from('work_orders').select('type'),
    ]);

    if (invoiceResult.error || payoutResult.error || workOrderResult.error) {
      toast.error('Unable to load report data');
      setLoading(false);
      return;
    }

    const invoices = (invoiceResult.data || []) as InvoiceQueryRow[];
    const payouts = (payoutResult.data || []) as PayoutQueryRow[];
    const workOrders = (workOrderResult.data || []) as WorkOrderQueryRow[];
    const rows = invoices.map(getLedgerRow);
    const paidRows = rows.filter((row) => row.status === 'paid');
    const gross = paidRows.reduce((sum, row) => sum + row.amount, 0);
    const expenses = payouts.reduce((sum, payout) => {
      const status = (payout.status || '').toLowerCase();
      return status === 'paid' || status === 'pending' ? sum + (Number(payout.amount) || 0) : sum;
    }, 0);
    const pendingAmount = rows
      .filter((row) => row.status === 'pending')
      .reduce((sum, row) => sum + row.amount, 0);
    const overdueAmount = rows
      .filter((row) => row.status === 'overdue')
      .reduce((sum, row) => sum + row.amount, 0);
    const net = gross - expenses;
    const margin = gross > 0 ? (net / gross) * 100 : 0;

    setLedgerRows(rows);
    setKpis({
      gross,
      expenses,
      net,
      margin,
      paidInvoices: paidRows.length,
      pendingAmount,
      overdueAmount,
    });
    setRevenueData(buildRevenueData(invoices));
    setServiceSplit(buildServiceSplit(workOrders));
    setGeneratedAt(new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date()));
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    printReportLedger({
      kpis,
      revenueData,
      serviceSplit,
      ledgerRows,
      generatedAt,
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-4 border-[#1a1a1a] pb-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">
            Financial Reports
          </h1>
          <p className="font-bold text-gray-600 mt-2 tracking-wider">LIVE LEDGER GENERATED FROM ORIGINAL RECORDS</p>
        </div>
        <div className="flex gap-4 print:hidden">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-2"
            onClick={() => downloadLedgerCsv(ledgerRows)}
          >
            <Download size={18} strokeWidth={3} />
            Export CSV
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer size={18} strokeWidth={3} />
            Print Ledger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group border-4 border-[#1a1a1a]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} />
          </div>
          <h3 className="font-bold uppercase text-sm text-gray-500 mb-1">Paid Revenue</h3>
          <p className="text-5xl font-black mt-2">{formatReportCurrency(kpis.gross)}</p>
          <div className="flex items-center gap-1 mt-4 text-green font-black text-sm uppercase bg-green/10 inline-block px-2 py-1 border-neo-sm">
            <TrendingUp size={16} strokeWidth={3} className="inline mr-1 -mt-1" />
            {kpis.paidInvoices} Paid
          </div>
        </Card>

        <Card className="relative overflow-hidden group border-4 border-[#1a1a1a]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={64} />
          </div>
          <h3 className="font-bold uppercase text-sm text-gray-500 mb-1">Recorded Payouts</h3>
          <p className="text-5xl font-black mt-2">{formatReportCurrency(kpis.expenses)}</p>
          <div className="flex items-center gap-1 mt-4 text-red font-black text-sm uppercase bg-red/10 inline-block px-2 py-1 border-neo-sm">
            <TrendingDown size={16} strokeWidth={3} className="inline mr-1 -mt-1" />
            Expense
          </div>
        </Card>

        <Card className="relative overflow-hidden group border-4 border-[#1a1a1a] bg-electricYellow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} />
          </div>
          <h3 className="font-bold uppercase text-sm text-[#1a1a1a] mb-1">Net Margin</h3>
          <p className="text-5xl font-black mt-2 text-[#1a1a1a]">{kpis.margin.toFixed(1)}%</p>
          <div className="flex items-center gap-1 mt-4 text-[#1a1a1a] font-black text-sm uppercase bg-white inline-block px-2 py-1 border-neo-sm">
            <TrendingUp size={16} strokeWidth={3} className="inline mr-1 -mt-1" />
            {formatReportCurrency(kpis.net)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <Card className="lg:col-span-2 flex flex-col h-full">
          <h3 className="font-black uppercase text-xl mb-6 border-b-2 border-dashed border-gray-300 pb-2">
            Revenue Velocity
          </h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFE500" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFE500" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d1d5db" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#d1d5db" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={{ strokeWidth: 2 }} tick={{ fontWeight: 'bold' }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `INR ${Number(val) / 1000}k`} tick={{ fontWeight: 'bold' }} />
                <Tooltip
                  formatter={(value) => formatReportCurrency(Number(value))}
                  contentStyle={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0 #1a1a1a', fontWeight: 'bold' }}
                />
                <Legend iconType="square" wrapperStyle={{ fontWeight: 'black', textTransform: 'uppercase' }} />
                <Area type="monotone" dataKey="previous" name="Previous 4 Weeks" stroke="#9ca3af" strokeWidth={3} fillOpacity={1} fill="url(#colorPrevious)" />
                <Area type="monotone" dataKey="current" name="Last 4 Weeks" stroke="#1a1a1a" strokeWidth={4} fillOpacity={1} fill="url(#colorCurrent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col h-full">
          <h3 className="font-black uppercase text-xl mb-6 border-b-2 border-dashed border-gray-300 pb-2">
            Service Distribution
          </h3>
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={serviceSplit}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="#1a1a1a"
                  strokeWidth={2}
                >
                  {serviceSplit.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0 #1a1a1a', fontWeight: 'bold' }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
