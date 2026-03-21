'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Layers, AlertCircle, AlertTriangle, Plus, Search, Grid, List as ListIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Dynamic data from DB

// Chart Analytics will be generated dynamically

export default function InventoryPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInventory() {
      const { data, error } = await supabase.from('inventory').select('*');
      if (!error && data && data.length > 0) {
        const mapped = data.map((item: any) => {
          let status = 'good';
          if (item.stock === 0) status = 'out';
          else if (item.stock <= item.min_stock) status = 'low';
          return {
            id: item.id.toString(),
            name: item.name,
            sku: item.sku,
            stock: item.stock,
            min: item.min_stock,
            cost: item.cost,
            sell: item.retail,
            supplier: item.supplier || 'Unknown',
            status: status
          };
        });
        setInventory(mapped);
      }
      setLoading(false);
    }
    fetchInventory();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">
            Parts Inventory
          </h1>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={18} strokeWidth={3} />
          Add Part
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-b-[6px] border-[#1a1a1a]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold uppercase text-sm text-gray-500">Total SKUs</h3>
            <Layers size={20} className="text-[#1a1a1a]" />
          </div>
          <p className="text-4xl font-black">{inventory.length}</p>
        </Card>
        <Card className="border-b-[6px] border-blue border-r-[#1a1a1a] border-l-[#1a1a1a] border-t-[#1a1a1a]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold uppercase text-sm text-gray-500">Stock Value</h3>
            <span className="font-black text-xl text-blue">₹</span>
          </div>
          <p className="text-4xl font-black">
            {inventory.reduce((sum, item) => sum + (item.stock * item.cost), 0).toLocaleString()}
          </p>
        </Card>
        <Card className="border-b-[6px] border-orange border-r-[#1a1a1a] border-l-[#1a1a1a] border-t-[#1a1a1a]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold uppercase text-sm text-gray-500">Low Stock</h3>
            <AlertTriangle size={20} className="text-orange" />
          </div>
          <p className="text-4xl font-black">{inventory.filter(i => i.status === 'low').length}<span className="text-lg text-gray-400 ml-2">Items</span></p>
        </Card>
        <Card className="border-b-[6px] border-red border-r-[#1a1a1a] border-l-[#1a1a1a] border-t-[#1a1a1a] relative overflow-hidden group">
          <div className="absolute inset-0 bg-red/10 animate-pulse pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="font-bold uppercase text-sm text-gray-500">Out of Stock</h3>
            <AlertCircle size={20} className="text-red" />
          </div>
          <p className="text-4xl font-black text-red relative z-10">{inventory.filter(i => i.status === 'out').length}<span className="text-lg text-gray-400 ml-2">Items</span></p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 py-4 border-y-4 border-dashed border-[#1a1a1a]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by Part Name or SKU..." 
            className="w-full pl-10 pr-4 py-2 border-neo focus:ring-2 focus:ring-electricYellow outline-none transition-shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={view === 'grid' ? 'primary' : 'outline'} 
            className="px-3"
            onClick={() => setView('grid')}
          >
            <Grid size={20} />
          </Button>
          <Button 
            variant={view === 'table' ? 'primary' : 'outline'} 
            className="px-3"
            onClick={() => setView('table')}
          >
            <ListIcon size={20} />
          </Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-3 p-8 font-black text-center text-gray-500 tracking-widest uppercase">Fetching Cloud Inventory...</div>
          ) : inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())).map((item) => (
            <Card 
              key={item.id} 
              className={`relative flex flex-col ${item.status === 'out' ? 'border-red shadow-[0_0_15px_rgba(226,75,74,0.3)]' : item.status === 'low' ? 'border-orange' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-[#1a1a1a] text-white font-mono text-xs px-2 py-1 tracking-widest font-black">
                  {item.sku}
                </span>
                {item.status === 'out' && <Badge className="bg-red text-white uppercase text-[10px] animate-pulse">Out of Stock</Badge>}
                {item.status === 'low' && <Badge className="bg-orange text-white uppercase text-[10px]">Low Stock</Badge>}
                {item.status === 'good' && <Badge className="bg-green text-white uppercase text-[10px]">In Stock</Badge>}
              </div>
              
              <h3 className="font-black uppercase text-xl mb-4 leading-tight">{item.name}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Stock Level</p>
                  <p className={`text-3xl font-black ${item.status === 'out' ? 'text-red' : item.status === 'low' ? 'text-orange' : 'text-green'}`}>
                    {item.stock} <span className="text-sm font-bold text-[#1a1a1a]">/ {item.min} Min</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Cost / Retail</p>
                  <p className="text-lg font-black tracking-wide">₹{item.cost} <span className="text-gray-400">|</span> <span className="text-blue">₹{item.sell}</span></p>
                </div>
              </div>

              <div className="mt-auto flex gap-2">
                <Button variant="outline" className="flex-1 text-xs py-2 shadow-neo-sm">Adjust</Button>
                <Button variant="primary" className={`flex-1 text-xs py-2 shadow-neo-sm ${item.status === 'out' ? 'animate-pulse' : ''}`}>Reorder</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#1a1a1a] text-white">
                  <th className="p-4 font-black uppercase tracking-wider text-sm border-r-2 border-[#1a1a1a]">SKU</th>
                  <th className="p-4 font-black uppercase tracking-wider text-sm border-r-2 border-[#1a1a1a]">Part Name</th>
                  <th className="p-4 font-black uppercase tracking-wider text-sm border-r-2 border-[#1a1a1a]">Stock</th>
                  <th className="p-4 font-black uppercase tracking-wider text-sm border-r-2 border-[#1a1a1a]">Status</th>
                  <th className="p-4 font-black uppercase tracking-wider text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={5} className="p-8 text-center font-black tracking-widest uppercase text-gray-500">Fetching Cloud Inventory...</td></tr>
                ) : inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())).map((item, i) => (
                  <tr key={item.id} className={`border-b-2 border-[#1a1a1a] ${i % 2 === 0 ? 'bg-white' : 'bg-cream'} font-bold`}>
                    <td className="p-4 font-mono text-sm border-r-2 border-[#1a1a1a]">{item.sku}</td>
                    <td className="p-4 uppercase border-r-2 border-[#1a1a1a]">{item.name}</td>
                    <td className="p-4 border-r-2 border-[#1a1a1a]">
                      <span className={`text-lg font-black ${item.status === 'out' ? 'text-red' : item.status === 'low' ? 'text-orange' : 'text-green'}`}>
                        {item.stock}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">/ {item.min} min</span>
                    </td>
                    <td className="p-4 border-r-2 border-[#1a1a1a]">
                      <Badge variant={item.status === 'out' ? 'overdue' : item.status === 'low' ? 'quality' : 'ready'} className="text-[10px]">
                        {item.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Button variant="outline" className="px-3 py-1 text-xs shadow-neo-xs">Reorder</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Analytics Underbelly */}
      <h2 className="font-black text-2xl tracking-widest uppercase text-[#1a1a1a] pt-8 border-t-8 border-[#1a1a1a]">
        Top Stock Value By Part
      </h2>
      <Card className="h-[350px]">
        <ResponsiveContainer width="99%" height="100%">
          <BarChart data={inventory.map(i => ({ name: i.name.split(' ')[0], value: i.cost * i.stock })).sort((a,b) => b.value - a.value).slice(0,6)} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={{ stroke: '#1a1a1a', strokeWidth: 3 }} tickLine={false} tick={{ fontWeight: 900, fill: '#1a1a1a' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: 900, fill: '#1a1a1a' }} />
            <Tooltip 
              cursor={{ fill: '#F5F0E8' }}
              contentStyle={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px #1a1a1a', fontWeight: 'bold' }}
            />
            <Bar dataKey="value" fill="#639922" stroke="#1a1a1a" strokeWidth={2} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
