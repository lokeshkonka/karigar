'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { QrCode, Loader2, Car, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import dynamic from 'next/dynamic';
const VehicleModelViewer = dynamic(() => import('@/components/3d/VehicleModelViewer').then(mod => mod.VehicleModelViewer), { 
  ssr: false, 
  loading: () => <div className="h-full flex items-center justify-center bg-gray-100"><Loader /></div> 
});
import { QRCodeSVG } from 'qrcode.react';

interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  scan_3d_data?: any;
}

export default function StaffScanPage() {
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('vehicles')
        .select('id, plate, make, model, year, color, scan_3d_data')
        .order('created_at', { ascending: false })
        .limit(20);
      setVehicles(data || []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (selected) {
      setQrUrl(`${window.location.origin}/scan-intake/${selected.id}?source=staff-qr`);
    }
  }, [selected]);

  const filtered = vehicles.filter(v =>
    `${v.make} ${v.model} ${v.plate}`.toLowerCase().includes(search.toLowerCase())
  );

  const displayVehicles = filtered;

  if (selected) {
    return (
      <div className="space-y-6 animate-in fade-in pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#1a1a1a] pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-2 border-2 border-[#1a1a1a] bg-cream text-[#1a1a1a] font-black text-xs hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div>
              <h2 className="text-2xl lg:text-3xl font-black uppercase text-[#1a1a1a] leading-none mb-1">{selected.make} {selected.model}</h2>
              <span className="font-mono bg-electricYellow text-[#1a1a1a] px-2 py-0.5 border-2 border-[#1a1a1a] font-black text-sm tracking-widest inline-block">{selected.plate}</span>
            </div>
          </div>
        </div>

        {/* 3D Model preview if color exists */}
        <div className="h-[400px] border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] bg-white">
          <VehicleModelViewer
            color={selected.color || '#888888'}
            scaleX={selected.scan_3d_data?.scaleX || 1.0}
            scaleZ={selected.scan_3d_data?.scaleZ || 1.0}
            info={[
              { label: 'Plate', value: selected.plate },
              { label: 'Year', value: String(selected.year || '—') },
            ]}
          />
        </div>

        <div className="border-4 border-[#1a1a1a] bg-cream p-4 font-bold text-xs uppercase tracking-wider text-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
          Last scan:{' '}
          {selected.scan_3d_data?.scanned_at
            ? `${new Date(selected.scan_3d_data.scanned_at).toLocaleString()}${
                selected.scan_3d_data?.scanned_by_name ? ` by ${selected.scan_3d_data.scanned_by_name}` : ''
              }`
            : 'Not scanned yet'}
          <span className="ml-2 text-gray-600">
            Source: {selected.scan_3d_data?.source || '—'}
          </span>
        </div>

        {/* QR Code for mobile scan */}
        <div className="bg-cream border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-6 lg:p-8 mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 border-2 border-[#1a1a1a] bg-white">
              <QrCode size={28} className="text-[#1a1a1a]" />
            </div>
            <div>
              <h3 className="font-black uppercase text-[#1a1a1a] text-xl">Mobile Scan QR</h3>
              <p className="text-sm text-gray-600 font-bold uppercase tracking-wider">Scan this on your phone to launch 3D scanner</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {qrUrl && (
              <div className="bg-white p-4 border-4 border-[#1a1a1a] shrink-0">
                <QRCodeSVG value={qrUrl} size={150} fgColor="#1a1a1a" bgColor="#ffffff" level="H" />
              </div>
            )}
            <div className="space-y-4">
              <p className="text-sm text-gray-500 font-bold uppercase">Or open directly on this device:</p>
              <Link href={`/scan-intake/${selected.id}?source=staff-qr`} target="_blank" className="inline-block">
                <button className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1a1a1a] text-electricYellow font-black uppercase tracking-widest hover:bg-electricYellow hover:text-[#1a1a1a] transition-colors border-2 border-[#1a1a1a]">
                  <Camera size={24} strokeWidth={2.5} />
                  Launch Scanner
                </button>
              </Link>
              <p className="text-xs text-blue underline font-bold truncate max-w-[250px] md:max-w-md">{qrUrl}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="border-b-4 border-[#1a1a1a] pb-4">
        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">Vehicle Scanner</h2>
        <p className="text-sm font-bold text-gray-500 uppercase">Select a vehicle to scan or view 3D model</p>
      </div>

      <input
        type="text"
        placeholder="Search plate, make or model..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-4 bg-white border-4 border-[#1a1a1a] text-[#1a1a1a] font-bold outline-none focus:ring-4 focus:ring-electricYellow/50 uppercase placeholder:normal-case placeholder:font-normal"
      />

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {displayVehicles.map(v => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              className="w-full bg-white border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] hover:translate-x-1 hover:translate-y-1 hover:shadow-none p-4 flex items-center gap-4 text-left transition-all group"
            >
              <div
                className="w-16 h-16 border-2 border-[#1a1a1a] shrink-0 flex items-center justify-center transition-colors"
                style={{ backgroundColor: v.color || '#e5e7eb' }}
              >
                <Car size={32} className="text-white mix-blend-difference" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-[#1a1a1a] text-lg uppercase leading-tight md:text-xl truncate">{v.make} {v.model} ({v.year})</p>
                <p className="font-mono bg-[#1a1a1a] text-electricYellow inline-block px-2 text-xs md:text-sm tracking-widest font-black mt-1 py-0.5">{v.plate}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mt-2">
                  {v.scan_3d_data?.scanned_at ? `Last Scan: ${new Date(v.scan_3d_data.scanned_at).toLocaleString()}` : 'Last Scan: Not scanned'}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-gray-500 group-hover:text-[#1a1a1a] px-4 py-2 border-2 border-transparent group-hover:border-[#1a1a1a] transition-all bg-cream">
                <QrCode size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Scan / View</span>
              </div>
            </button>
          ))}
          {displayVehicles.length === 0 && (
            <div className="text-center bg-cream border-4 border-dashed border-gray-300 py-12">
              <p className="text-gray-500 font-black uppercase tracking-widest">No matching vehicles found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
