'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { TrendingUp, Clock, AlertTriangle } from 'lucide-react';

// Dynamic Dashboard Stats, Charts, and Jobs

export default function DashboardPage() {
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [jobsChart, setJobsChart] = useState<any[]>([]);
  const [revChart, setRevChart] = useState<any[]>([]);
  const [stats, setStats] = useState({ todayRev: 0, jobsMonth: 0, pendingInvoices: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const { data: activeData, error } = await supabase
        .from('work_orders')
        .select(`
          id, status, type, created_at, updated_at,
          vehicles ( plate ),
          customers ( name )
        `)
        .neq('status', 'DELIVERED')
        .order('updated_at', { ascending: false })
        .limit(12);

      if (!error && activeData) {
        const mapped = activeData.map((job: any) => ({
          id: `JOB-${job.id.substring(0,6)}`,
          plate: (Array.isArray(job.vehicles) ? job.vehicles[0]?.plate : job.vehicles?.plate) || 'Unknown',
          customer: (Array.isArray(job.customers) ? job.customers[0]?.name : job.customers?.name) || 'Walk-In',
          type: job.type || 'Service',
          status: job.status.toLowerCase(),
          time: new Date(job.updated_at || job.created_at).toLocaleString()
        }));
        setActiveJobs(mapped);
      }

      // Fetch analytics sources
      const [invRes, allJobsRes] = await Promise.all([
        supabase.from('invoices').select('amount, status, created_at'),
        supabase.from('work_orders').select('type, created_at')
      ]);

      if (allJobsRes.data) {
        const jobsThisMonth = allJobsRes.data.filter((job: any) => new Date(job.created_at) >= monthStart).length;
        setStats(s => ({ ...s, jobsMonth: jobsThisMonth }));

        const typeCounts = allJobsRes.data.reduce((acc: any, job: any) => {
          acc[job.type] = (acc[job.type] || 0) + 1;
          return acc;
        }, {});
        const colors = ['#E24B4A', '#3B8BD4', '#1a1a1a', '#639922', '#EF9F27'];
        setJobsChart(Object.entries(typeCounts).map(([name, count], i) => ({ name, count, color: colors[i % colors.length] })));
      }

      if (invRes.data) {
        let todayRevenue = 0;
        let pending = 0;
        let overdue = 0;
        const dailyRevenueMap = new Map<string, number>();

        // Initialize last 7 days for stable chart axis.
        for (let offset = 6; offset >= 0; offset -= 1) {
          const d = new Date(now);
          d.setDate(now.getDate() - offset);
          const key = d.toISOString().slice(0, 10);
          dailyRevenueMap.set(key, 0);
        }

        invRes.data.forEach((inv: any) => {
          const amount = Number(inv.amount) || 0;
          const createdAt = inv.created_at ? new Date(inv.created_at) : null;

          if (inv.status === 'paid') {
            if (createdAt && createdAt >= todayStart) todayRevenue += amount;
            if (createdAt) {
              const key = createdAt.toISOString().slice(0, 10);
              if (dailyRevenueMap.has(key)) {
                dailyRevenueMap.set(key, (dailyRevenueMap.get(key) || 0) + amount);
              }
            }
          }
          if (inv.status === 'pending') pending += Number(inv.amount);
          if (inv.status === 'overdue') { pending += Number(inv.amount); overdue++; }
        });
        setStats(s => ({ ...s, todayRev: todayRevenue, pendingInvoices: pending, overdue }));

        const chartRows = Array.from(dailyRevenueMap.entries()).map(([key, revenue]) => {
          const date = new Date(`${key}T00:00:00`);
          return {
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            revenue: Math.round(revenue),
          };
        });
        setRevChart(chartRows);
      }

      setLoading(false);
    }

    fetchDashboard();

    const refreshTimer = setInterval(fetchDashboard, 45000);
    const channel = supabase
      .channel('admin-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, () => fetchDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchDashboard())
      .subscribe();

    return () => {
      clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">
            Operations Overview
          </h1>
          <p className="font-bold text-gray-600 mt-2 tracking-wider">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-full h-[6px] bg-green"></div>
          <h3 className="font-bold uppercase text-sm text-gray-500 mb-1">Total Revenue</h3>
          <p className="text-4xl font-black">₹ {stats.todayRev.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-green font-bold text-sm">
            <TrendingUp size={16} strokeWidth={3} />
            + LIVE DATA
          </div>
        </Card>
        <Card className="relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-full h-[6px] bg-blue"></div>
          <h3 className="font-bold uppercase text-sm text-gray-500 mb-1">Total Jobs</h3>
          <p className="text-4xl font-black">{stats.jobsMonth}</p>
          <div className="flex items-center gap-1 mt-2 text-blue font-bold text-sm">
            <TrendingUp size={16} strokeWidth={3} />
            + ALL TIME
          </div>
        </Card>
        <Card className="relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-full h-[6px] bg-electricYellow"></div>
          <h3 className="font-bold uppercase text-sm text-gray-500 mb-1">Vehicles in Bay</h3>
          <p className="text-4xl font-black">{activeJobs.length} <span className="text-2xl text-gray-400">/ Active</span></p>
          <div className="flex items-center gap-1 mt-2 text-[#1a1a1a] font-bold text-sm">
            <Clock size={16} strokeWidth={3} />
            Capacity
          </div>
        </Card>
        <Card className="relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-full h-[6px] bg-red"></div>
          <h3 className="font-bold uppercase text-sm text-gray-500 mb-1">Pending Invoices</h3>
          <p className="text-4xl font-black">₹ {(stats.pendingInvoices).toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-red font-bold text-sm">
            <AlertTriangle size={16} strokeWidth={3} />
            {stats.overdue} Overdue
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col h-[400px]">
          <h3 className="font-black uppercase text-xl mb-6 border-b-2 border-dashed border-gray-300 pb-2">
            Weekly Revenue Trends
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={revChart} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#1a1a1a', strokeWidth: 3 }} 
                  tickLine={false} 
                  tick={{ fontWeight: 900, fill: '#1a1a1a' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontWeight: 900, fill: '#1a1a1a' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#F5F0E8' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '3px solid #1a1a1a', 
                    boxShadow: '4px 4px 0 #1a1a1a',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                />
                <Bar dataKey="revenue" fill="#FFE500" stroke="#1a1a1a" strokeWidth={2}>
                  <LabelList dataKey="revenue" position="top" style={{ fontWeight: 900, fill: '#1a1a1a' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col h-[400px]">
          <h3 className="font-black uppercase text-xl mb-6 border-b-2 border-dashed border-gray-300 pb-2">
            Jobs By Type
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={jobsChart} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={{ stroke: '#1a1a1a', strokeWidth: 3 }} 
                  tickLine={false} 
                  tick={{ fontWeight: 900, fill: '#1a1a1a', fontSize: 12 }} 
                  width={90}
                />
                <Tooltip 
                  cursor={{ fill: '#F5F0E8' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '3px solid #1a1a1a', 
                    boxShadow: '4px 4px 0 #1a1a1a',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                />
                <Bar dataKey="count" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth={2}>
                  {jobsChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fontWeight: 900, fill: '#1a1a1a' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tables Row */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black uppercase text-xl border-b-4 border-electricYellow pb-1 inline-block">
            Active Work Orders
          </h3>
          <Link href="/admin/jobs" className="py-2 px-3 text-xs font-black uppercase border-2 border-[#1a1a1a] bg-white hover:bg-cream">
            View All
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] text-white">
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Job ID</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Vehicle</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Customer</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Type</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Time</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Status</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm border-2 border-[#1a1a1a]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center font-bold">Loading Live DB Data...</td></tr>
              ) : activeJobs.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center font-bold text-gray-500">No active work orders.</td></tr>
              ) : activeJobs.map((job, i) => (
                <tr key={job.id} className={`border-2 border-[#1a1a1a] font-bold ${i % 2 === 0 ? 'bg-white' : 'bg-cream'}`}>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">{job.id}</td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">
                    <span className="bg-electricYellow px-2 py-1 font-mono tracking-widest border-neo-sm text-sm inline-block">
                      {job.plate}
                    </span>
                  </td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">{job.customer}</td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">{job.type}</td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">{job.time}</td>
                  <td className="p-4 border-r-2 border-[#1a1a1a]">
                    <Badge variant={job.status as any}>{job.status}</Badge>
                  </td>
                  <td className="p-4">
                    <Link
                      href="/admin/jobs"
                      className="px-3 py-1 text-xs font-black uppercase border-2 border-[#1a1a1a] bg-white hover:bg-cream"
                    >
                      Open
                    </Link>
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
