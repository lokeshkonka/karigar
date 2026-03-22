'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Car, X, Calendar as CalIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  plate: string;
  fuel: string;
  color: string;
}

const MAKES = ['Hyundai', 'Maruti Suzuki', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Kia', 'Volkswagen', 'Skoda', 'Ford', 'Other'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'EV', 'Hybrid'];

export default function MyVehiclesPage() {
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRForVehicle, setShowQRForVehicle] = useState<string | null>(null);
  
  // Modals state
  const [form, setForm] = useState({ make: 'Hyundai', model: '', year: '', plate: '', fuel: 'Petrol', color: '#FFFFFF' });
  const [loading, setLoading] = useState(true);

  // Booking Service State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookForm, setBookForm] = useState({ date: '', time: '10:00', issue: '' });
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    setLoading(true);
    if (!user?.email) { setLoading(false); return; }
    
    const { data: cust } = await supabase.from('customers').select('id').eq('email', user.email).maybeSingle();
    if (cust) {
      const { data } = await supabase.from('vehicles').select('*').eq('customer_id', cust.id).order('created_at', { ascending: false });
      if (data) {
        setVehicles(data.map(v => ({
          id: v.id, make: v.make, model: v.model, year: v.year?.toString() || '2020', plate: v.plate, fuel: v.fuel || 'Unknown', color: v.color || '#FFFFFF'
        })));
      }
    }
    setLoading(false);
  }

  const handleAdd = async () => {
    if (!form.model || !form.year || !form.plate) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (!user?.email) return;
    
    const { data: custData, error: custErr } = await supabase.from('customers').select('id, name').eq('email', user.email).maybeSingle();
    if (!custData || custErr) { toast.error('Account not synced yet. Try logging in again.'); return; }
    
    // Insert vehicle
    const { data, error } = await supabase.from('vehicles').insert([{
      customer_id: custData.id,
      make: form.make,
      model: form.model,
      year: parseInt(form.year, 10),
      plate: form.plate,
      fuel: form.fuel,
      color: form.color
    }]).select();

    if (error || !data) {
      toast.error('Failed to add vehicle');
      return;
    }

    const v = data[0];
    setVehicles(prev => [{ id: v.id, make: v.make, model: v.model, year: v.year?.toString() || form.year, plate: v.plate, fuel: v.fuel || form.fuel, color: v.color || form.color }, ...prev]);
    toast.success(`${form.make} ${form.model} added to your Garage!`);
    setShowAddModal(false);
    setForm({ make: 'Hyundai', model: '', year: '', plate: '', fuel: 'Petrol', color: '#FFFFFF' });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (!error) {
      setVehicles(prev => prev.filter(v => v.id !== id));
      toast.success('Vehicle removed');
    } else {
      toast.error('Failed to delete vehicle');
    }
  };

  const handleBookService = async () => {
    if (!bookForm.date || !bookForm.time || !bookForm.issue) {
      toast.error('Please complete all booking fields.');
      return;
    }
    if (!selectedVehicle || !user?.email) return;
    setScheduling(true);

    const { data: custData } = await supabase.from('customers').select('id, name').eq('email', user.email).maybeSingle();
    if (!custData) return;

    // Create Work Order
    const { data: woData, error: woError } = await supabase.from('work_orders').insert({
      vehicle_id: selectedVehicle.id,
      customer_id: custData.id,
      customer_name: custData.name,
      plate: selectedVehicle.plate,
      type: 'General Service',
      status: 'WAITING',
      priority: 'normal',
      issue_description: bookForm.issue
    }).select().single();

    if (woError || !woData) {
      toast.error('Failed to book service.');
      setScheduling(false);
      return;
    }

    // Parse date time
    const startObj = new Date(`${bookForm.date}T${bookForm.time}:00`);
    
    // Create Appointment
    await supabase.from('appointments').insert({
      work_order_id: woData.id,
      customer_id: custData.id,
      bay: 'Unassigned',
      start_time: startObj.toISOString(),
      duration_hours: 2,
      title: `Service: ${selectedVehicle.plate}`,
      type: 'service'
    });

    toast.success(`Service Booked for ${new Date(bookForm.date).toLocaleDateString()} at ${bookForm.time}`);
    setShowBookModal(false);
    setBookForm({ date: '', time: '10:00', issue: '' });
    setSelectedVehicle(null);
    setScheduling(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">My Garage</h1>
          <p className="text-sm font-bold text-gray-500">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
          <Plus size={18} strokeWidth={3} /> Add Vehicle
        </Button>
      </div>

      <div className="space-y-4">
        {vehicles.map(v => (
          <Card key={v.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 bg-white border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div
                className="w-14 h-14 border-4 border-[#1a1a1a] shrink-0 flex items-center justify-center font-black text-2xl"
                style={{ backgroundColor: v.color }}
              >
                <Car size={28} className="text-white mix-blend-difference" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black uppercase text-2xl leading-none text-[#1a1a1a]">{v.make} {v.model}</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">{v.year} Model</p>
                <div className="mt-2 inline-block bg-electricYellow text-[#1a1a1a] border-2 border-[#1a1a1a] font-mono text-sm px-3 py-1 font-black tracking-widest">
                  {v.plate}
                </div>
                <p className="mt-2 text-xs font-black uppercase tracking-wider text-gray-600">Fuel: {v.fuel}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0 pt-4 lg:pt-0 border-t-2 border-dashed border-gray-200 lg:border-t-0">
              <Button onClick={() => { setSelectedVehicle(v); setShowBookModal(true); }} className="flex-1 lg:flex-none uppercase font-black bg-[#1a1a1a] text-white hover:bg-electricYellow hover:text-[#1a1a1a] tracking-widest px-6 py-6 border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
                 <CalIcon size={20} className="mr-2" /> Book Service
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQRForVehicle(v.id)}
                className="px-4 py-6 border-2 border-[#1a1a1a] font-black uppercase text-[#1a1a1a]"
              >
                Scan QR
              </Button>
              <button
                onClick={() => handleDelete(v.id)}
                className="p-3 text-gray-400 hover:text-red transition-colors shrink-0"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </Card>
        ))}
        {vehicles.length === 0 && !loading && (
          <div className="border-4 border-dashed border-[#1a1a1a] p-12 text-center bg-cream">
            <h3 className="text-xl font-black uppercase tracking-widest mb-2 text-[#1a1a1a]">Garage Empty</h3>
            <p className="text-gray-600 font-bold">Add your first vehicle to start scheduling services.</p>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-sm p-4">
          <div className="bg-cream border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#1a1a1a] pb-2">
              <h2 className="text-2xl font-black uppercase text-[#1a1a1a]">Add Profile</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-500 hover:text-red transition-colors">
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1 text-gray-600">Make *</label>
                <select
                  value={form.make}
                  onChange={e => setForm(f => ({ ...f, make: e.target.value }))}
                  className="w-full p-3 bg-white border-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow border-2"
                >
                  {MAKES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1 text-gray-600">Model *</label>
                <input
                  value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  placeholder="e.g. i20, Swift, Nexon"
                  className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1 text-gray-600">Year *</label>
                <input
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  placeholder="e.g. 2022"
                  type="number"
                  min="1990"
                  max="2026"
                  className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1 text-gray-600">Registration Plate *</label>
                <input
                  value={form.plate}
                  onChange={e => setForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))}
                  placeholder="e.g. MH 04 AB 1234"
                  className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-black font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-electricYellow uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1 text-gray-600">Fuel Type *</label>
                <select
                  value={form.fuel}
                  onChange={e => setForm(f => ({ ...f, fuel: e.target.value }))}
                  className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow"
                >
                  {FUEL_TYPES.map((fuel) => (
                    <option key={fuel} value={fuel}>{fuel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1 text-gray-600">Vehicle Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-14 h-14 border-2 border-[#1a1a1a] cursor-pointer bg-white p-1"
                  />
                  <span className="font-black font-mono text-lg text-[#1a1a1a]">{form.color.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 border-2 border-[#1a1a1a] font-black uppercase hover:bg-gray-200 transition-colors text-[#1a1a1a]">
                Cancel
              </button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-electricYellow border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-black uppercase hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-[#1a1a1a]">
                Add to Garage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Service Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-sm p-4">
          <Card className="bg-white border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6 max-w-md w-full relative">
            <button onClick={() => setShowBookModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red"><X size={24}/></button>
            <h2 className="text-2xl font-black uppercase text-[#1a1a1a] mb-2">Book Service</h2>
            <div className="bg-electricYellow/20 inline-block px-3 py-1 border-2 border-electricYellow font-mono font-black text-sm mb-6 uppercase text-[#1a1a1a]">
              {selectedVehicle?.make} {selectedVehicle?.model} - {selectedVehicle?.plate}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1 text-gray-500">Pick a Date *</label>
                  <input 
                    type="date" 
                    value={bookForm.date} 
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full border-2 border-[#1a1a1a] p-3 font-bold bg-cream outline-none focus:ring-2 focus:ring-blue text-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1 text-gray-500">Drop-off Time *</label>
                  <input 
                    type="time" 
                    value={bookForm.time} 
                    onChange={(e) => setBookForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full border-2 border-[#1a1a1a] p-3 font-bold bg-cream outline-none focus:ring-2 focus:ring-blue text-[#1a1a1a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1 text-gray-500">What's wrong? (Issue)</label>
                <textarea
                  value={bookForm.issue}
                  onChange={e => setBookForm(p => ({ ...p, issue: e.target.value }))}
                  placeholder="e.g. Needs oil change, AC not cooling..."
                  className="w-full p-3 bg-cream border-2 border-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-blue h-24 resize-none text-[#1a1a1a]"
                />
              </div>
            </div>

            <Button onClick={handleBookService} disabled={scheduling} className="w-full mt-6 py-6 text-lg font-black uppercase tracking-widest bg-blue border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] text-white">
              {scheduling ? 'Booking...' : 'Confirm Appointment'}
            </Button>
          </Card>
        </div>
      )}

      {/* QR Code Modal for Staff */}
      {showQRForVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-sm p-4">
          <div className="bg-cream border-4 border-[#1a1a1a] p-8 w-full max-w-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200 shadow-[8px_8px_0_#1a1a1a]">
            <h2 className="text-2xl font-black uppercase text-center leading-tight text-[#1a1a1a]">Vehicle Fast-Pass</h2>
            <div className="p-4 bg-white border-4 border-[#1a1a1a]">
              {/* Point to the new scan-intake route directly */}
              <QRCodeSVG 
                value={`${window.location.origin}/scan-intake/${showQRForVehicle}?source=customer-pass`} 
                size={220} 
                level="M" 
                fgColor="#1a1a1a"
                className="w-full h-auto"
              />
            </div>
            <p className="text-xs font-bold text-gray-600 text-center uppercase tracking-wide">
              Show this QR code to the workshop technician for quick 3D check-in
            </p>
            <Button onClick={() => setShowQRForVehicle(null)} className="w-full mt-2 py-6 font-black tracking-widest uppercase border-[#1a1a1a] bg-[#1a1a1a] text-white">
              Close Pass
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
