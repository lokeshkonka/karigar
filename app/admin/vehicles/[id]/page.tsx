'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, QrCode, Camera, Loader2, RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';
const VehicleModelViewer = dynamic(
  () => import('@/components/3d/VehicleModelViewer').then(m => m.VehicleModelViewer),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center animate-pulse bg-gray-100 rounded">Loading 3D Model...</div> }
);
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  fuel: string;
  color: string | null;
  scan_3d_data: any;
  created_at: string;
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('3d');
  const [scanUrl, setScanUrl] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [fuelDraft, setFuelDraft] = useState('Petrol');
  const [savingFuel, setSavingFuel] = useState(false);

  useEffect(() => {
    setScanUrl(`${window.location.origin}/scan-intake/${id}`);
    async function fetchVehicle() {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id as string)
        .maybeSingle();
      setVehicle(data);
      if (data?.fuel) setFuelDraft(data.fuel);
      setLoading(false);
    }
    fetchVehicle();
  }, [id]);

  if (loading) return <Loader fullScreen />;
  if (!vehicle) return <div className="p-12 text-center font-black uppercase text-gray-500">Vehicle not found</div>;

  const v = vehicle;

  const carColor = v.color || '#888888';

  const updateFuel = async () => {
    if (!vehicle) return;
    setSavingFuel(true);
    const { error } = await supabase.from('vehicles').update({ fuel: fuelDraft }).eq('id', vehicle.id);
    setSavingFuel(false);
    if (error) {
      toast.error('Failed to update fuel type');
      return;
    }
    setVehicle((prev) => (prev ? { ...prev, fuel: fuelDraft } : prev));
    toast.success('Fuel type updated');
  };

  return (
    <div className="space-y-6 animate-in fade-in h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b-4 border-[#1a1a1a] pb-4 shrink-0">
        <Link href="/admin/vehicles">
          <Button variant="outline" className="p-2 border-2"><ArrowLeft size={22} /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-black uppercase tracking-widest text-[#1a1a1a] flex flex-wrap items-center gap-3">
            {loading ? <Loader2 size={24} className="animate-spin" /> : `${v.make} ${v.model}`}
            <span className="bg-electricYellow px-3 py-1 font-mono tracking-widest border-neo text-xl">{v.plate}</span>
          </h1>
        </div>
        {/* Color swatch */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 border-2 border-[#1a1a1a]" style={{ backgroundColor: carColor }} />
          <span className="font-mono text-xs font-black">{carColor.toUpperCase()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 shrink-0 overflow-x-auto">
        {['3d', 'overview', 'history', 'qr'].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'outline'}
            className="py-2 shrink-0"
            onClick={() => setActiveTab(tab)}
          >
            {tab === '3d' ? '3D MODEL' : tab === 'qr' ? 'SCAN QR' : tab.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 bg-white border-neo shadow-neo overflow-hidden relative">

        {/* ── 3D Viewer ── */}
        {activeTab === '3d' && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 min-h-0">
              <VehicleModelViewer
                color={carColor}
                scaleX={v.scan_3d_data?.scaleX || 1.0}
                scaleZ={v.scan_3d_data?.scaleZ || 1.0}
                autoRotate={true}
                info={[
                  { label: 'Vehicle', value: `${v.make} ${v.model}` },
                  { label: 'Year', value: String(v.year || '—') },
                  { label: 'Scan Color', value: carColor.toUpperCase() },
                ]}
              />
            </div>
            <div className="shrink-0 p-4 border-t-4 border-[#1a1a1a] bg-cream flex justify-between items-center">
              <div>
                <p className="font-bold text-sm uppercase">AI Color Extracted via k-Means</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${v.color ? 'bg-green' : 'bg-orange'} text-white`}>
                    {v.color ? 'SCANNED' : 'AWAITING SCAN'}
                  </Badge>
                  <span className="text-xs font-bold text-gray-500">PBR Material · OrbitControls active</span>
                </div>
              </div>
              <Link href={`/scan-intake/${v.id}`} target="_blank">
                <Button className="flex items-center gap-2 py-2 text-sm">
                  <Camera size={16} strokeWidth={3} />
                  {v.color ? 'Re-Scan' : 'Scan Now'}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="p-8 overflow-y-auto w-full h-full space-y-6">
            <h2 className="text-2xl font-black uppercase border-l-4 border-electricYellow pl-4">Vehicle Specs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Make', value: v.make },
                { label: 'Model', value: v.model },
                { label: 'Year', value: v.year },
                { label: 'Fuel', value: v.fuel || '—' },
                { label: 'Plate', value: v.plate },
                { label: 'Paint', value: carColor.toUpperCase() },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-xs font-bold uppercase text-gray-500">{s.label}</p>
                  <div className="font-black text-lg flex items-center gap-2">
                    {s.label === 'Paint' && <div className="w-5 h-5 border-2 border-gray-300" style={{ backgroundColor: carColor }} />}
                    {s.value || '—'}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-dashed border-gray-300 pt-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">Edit Fuel Type</h3>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <select
                  value={fuelDraft}
                  onChange={(e) => setFuelDraft(e.target.value)}
                  className="border-2 border-[#1a1a1a] p-3 font-black bg-white focus:outline-none focus:ring-2 focus:ring-electricYellow"
                >
                  {['Petrol', 'Diesel', 'CNG', 'EV', 'Hybrid'].map((fuel) => (
                    <option key={fuel} value={fuel}>{fuel}</option>
                  ))}
                </select>
                <Button onClick={updateFuel} disabled={savingFuel} className="sm:w-auto">
                  {savingFuel ? 'Saving...' : 'Save Fuel Type'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── QR / Scan ── */}
        {activeTab === 'qr' && (
          <div className="p-8 overflow-y-auto w-full h-full">
            <div className="bg-[#1a1a1a] p-8 text-cream border-neo flex flex-col md:flex-row gap-8 items-center justify-between">
              <div>
                <h3 className="font-black text-2xl uppercase mb-2 flex items-center gap-3">
                  <QrCode size={28} className="text-electricYellow" /> Mobile 3D Intake
                </h3>
                <p className="font-bold text-gray-400 max-w-md mb-4">
                  Scan this QR on a mobile device to open the camera AI portal.
                  Staff takes a top-down and side view — our k-means algorithm extracts the color and builds a 3D model instantly.
                </p>
                <Link href={`/scan-intake/${v.id}`} target="_blank">
                  <Button className="flex items-center gap-2">
                    <Camera size={18} /> Open Scanner Directly
                  </Button>
                </Link>
              </div>
              <div className="bg-white p-4 border-4 border-electricYellow shrink-0 rotate-2 hover:rotate-0 transition-transform">
                {scanUrl ? (
                  <QRCodeSVG value={scanUrl} size={160} fgColor="#1a1a1a" bgColor="#ffffff" level="H" />
                ) : (
                  <Loader />
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
