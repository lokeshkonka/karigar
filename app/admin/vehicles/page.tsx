'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, Filter } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicles() {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`*, customers ( name )`);
        
      if (!error && data && data.length > 0) {
        setVehicles(data.map((v: any) => ({
          id: v.id.toString(),
          plate: v.plate,
          make: v.make,
          model: v.model,
          year: v.year,
          fuel: v.fuel || 'Petrol',
          owner: v.customers?.[0]?.name || v.customers?.name || 'Walk-In',
          jobs: 0
        })));
      }
      setLoading(false);
    }
    loadVehicles();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">Vehicles</h1>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={18} strokeWidth={3} />
          Add Vehicle
        </Button>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1 relative">
          <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a] mb-1 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border-neo focus:outline-none focus:ring-2 focus:ring-electricYellow" 
              placeholder="Search by Plate, Make, or Owner..."
            />
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2 py-3">
          <Filter size={18} /> Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-8 text-center font-bold text-gray-500 uppercase tracking-widest text-xl">
            Loading Vehicle Fleet...
          </div>
        ) : vehicles.map((v) => (
          <Card key={v.id} className="flex flex-col">
            <div className="aspect-video bg-[#1a1a1a] mb-4 flex items-center justify-center border-neo-sm relative overflow-hidden group">
              <span className="text-electricYellow font-black tracking-widest opacity-20 text-4xl transform -rotate-12">
                {v.make.toUpperCase()}
              </span>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Link href={`/admin/vehicles/${v.id}`}>
                  <Button variant="primary" className="py-2 text-xs">View Details</Button>
                </Link>
              </div>
            </div>
            
            <div className="flex justify-between items-start mb-2">
              <span className="bg-electricYellow px-2 py-1 font-mono tracking-widest border-neo-sm font-black">
                {v.plate}
              </span>
              <Badge variant="default" className="text-[10px]">{v.fuel}</Badge>
            </div>
            
            <h3 className="text-xl font-black uppercase mb-1">{v.make} {v.model}</h3>
            <p className="font-bold text-gray-600 text-sm mb-4">YEAR: {v.year}</p>
            
            <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-300 flex justify-between text-sm font-bold">
              <span>Owner: {v.owner}</span>
              <span>Jobs: {v.jobs}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
