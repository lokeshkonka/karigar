'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls, Html, Grid, ContactShadows,
  Environment, SpotLight, useHelper, Sparkles,
  MeshReflectorMaterial, RoundedBox,
} from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '@/lib/supabase';
import { withClientCache } from '@/lib/clientCache';
import { MapPin, User, Wrench, AlertTriangle, CheckCircle2, Clock, X, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { CarMeshProps } from '@/components/3d/CarMesh';
const CarMesh = dynamic<CarMeshProps>(() => import('@/components/3d/CarMesh').then(m => m.CarMesh), { ssr: false });

// ─── Bay layout: 2 rows of 3 ──────────────────────────────────────────────
const INITIAL_BAYS = [
  { id: '1', position: [-5.5, 0, -2.5] as [number, number, number], status: 'empty', vehicle: '', makeModel: '', type: '', mechanic: '', time: '' },
  { id: '2', position: [ 0,   0, -2.5] as [number, number, number], status: 'empty', vehicle: '', makeModel: '', type: '', mechanic: '', time: '' },
  { id: '3', position: [ 5.5, 0, -2.5] as [number, number, number], status: 'empty', vehicle: '', makeModel: '', type: '', mechanic: '', time: '' },
  { id: '4', position: [-5.5, 0,  3.5] as [number, number, number], status: 'empty', vehicle: '', makeModel: '', type: '', mechanic: '', time: '' },
  { id: '5', position: [ 0,   0,  3.5] as [number, number, number], status: 'empty', vehicle: '', makeModel: '', type: '', mechanic: '', time: '' },
  { id: '6', position: [ 5.5, 0,  3.5] as [number, number, number], status: 'empty', vehicle: '', makeModel: '', type: '', mechanic: '', time: '' },
];

const STATUS_COLORS: Record<string, string> = {
  empty:    '#f8f9fa',
  occupied: '#ffe500',
  overdue:  '#e24b4a',
  ready:    '#3b8bd4',
};

const STATUS_EMISSIVE: Record<string, string> = {
  empty:    '#000000',
  occupied: '#c8a800',
  overdue:  '#8b1010',
  ready:    '#144d88',
};

const STATUS_LIGHT: Record<string, string> = {
  empty:    '#ffffff',
  occupied: '#ffe066',
  overdue:  '#ff4444',
  ready:    '#44aaff',
};

// ─── Bay Vehicle Wrapper ─────────────────────────────────────────────────────────
function BayVehicle({ bay, isSelected }: { bay: any; isSelected: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const BAY_CAR_X_OFFSET = 0.8;
  const BAY_CAR_Y_OFFSET = 0.2;
  const BAY_CAR_Z_OFFSET = 5.85;

  const statusFallbackColor =
    bay.status === 'overdue'  ? '#c0392b' :
    bay.status === 'ready'    ? '#1a5fa8' :
    bay.status === 'occupied' ? '#1a1a1a' : '#555';
  const carBodyColor = bay.carColor || statusFallbackColor;

  useFrame((state) => {
    if (!groupRef.current) return;
    if (isSelected) {
      groupRef.current.position.y = BAY_CAR_Y_OFFSET + Math.sin(state.clock.elapsedTime * 1.4) * 0.035;
    } else {
      groupRef.current.position.y = BAY_CAR_Y_OFFSET;
    }
  });

  return (
    <group ref={groupRef} position={[BAY_CAR_X_OFFSET, BAY_CAR_Y_OFFSET, BAY_CAR_Z_OFFSET]}>
      <CarMesh color={carBodyColor} scaleX={0.9} scaleZ={0.9} autoRotate={false} />

      {/* ── Headlight cones ── */}
      {isSelected && (
        <>
          <spotLight position={[0.52, 0.34, 2.1]} target-position={[0.52, 0, 6]} angle={0.25} penumbra={0.4} intensity={8} color="#fffae0" distance={10} castShadow />
          <spotLight position={[-0.52, 0.34, 2.1]} target-position={[-0.52, 0, 6]} angle={0.25} penumbra={0.4} intensity={8} color="#fffae0" distance={10} castShadow />
        </>
      )}

      {/* ── Licence plate ── */}
      <Html position={[0, 1.45, 0]} center>
        <div className={`px-3 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col items-center gap-0.5 min-w-[90px] transition-all duration-300 border-2 ${
          isSelected
            ? 'bg-[#ffe500] border-[#1a1a1a] scale-125 shadow-[0_0_20px_rgba(255,229,0,0.6)]'
            : 'bg-[#111] border-gray-600'
        }`}>
          <span className={`text-[9px] font-bold uppercase opacity-70 tracking-widest ${isSelected ? 'text-[#1a1a1a]' : 'text-gray-400'}`}>{bay.makeModel || 'Vehicle'}</span>
          <span className={`font-mono text-sm font-black tracking-widest ${isSelected ? 'text-[#1a1a1a]' : 'text-white'}`}>{bay.vehicle}</span>
        </div>
      </Html>

      {/* ── Status glow light ── */}
      {bay.status !== 'empty' && (
        <pointLight
          position={[0, 1.6, 0]}
          color={STATUS_LIGHT[bay.status]}
          intensity={isSelected ? 4 : 1.2}
          distance={5}
        />
      )}
    </group>
  );
}

// ─── Bay Platform ──────────────────────────────────────────────────────────
function BayMesh({ bay, isSelected, onClick }: { bay: any; isSelected: boolean; onClick: () => void }) {
  const isOccupied = bay.status !== 'empty';
  const platformRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (bay.status === 'overdue' && platformRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
      (platformRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 1.4;
    }
    if (glowRef.current && isSelected) {
      (glowRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.18 + (Math.sin(state.clock.elapsedTime * 2) + 1) * 0.06;
    }
  });

  return (
    <group position={bay.position} onClick={(e) => { e.stopPropagation(); onClick(); }}>

      {/* ── Epoxy slab with reflectivity ── */}
      <mesh ref={platformRef} position={[0, 0.07, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.7, 0.14, 5.3]} />
        <meshStandardMaterial
          color={STATUS_COLORS[bay.status] || STATUS_COLORS.empty}
          emissive={STATUS_EMISSIVE[bay.status] || '#000'}
          emissiveIntensity={0.0}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>

      {/* ── Beveled curb edges ── */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[4.76, 0.04, 5.36]} />
        <meshStandardMaterial color="#888" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* ── Painted lane markings ── */}
      {[-2.3, 2.3].map((x, i) => (
        <mesh key={i} position={[x, 0.175, 0]}>
          <boxGeometry args={[0.08, 0.02, 5.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}
      {[-2.7, 2.7].map((z, i) => (
        <mesh key={i} position={[0, 0.175, z]}>
          <boxGeometry args={[4.76, 0.02, 0.08]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}

      {/* ── Dashed centre lane ── */}
      {[-1.6, -0.8, 0, 0.8, 1.6].map((z, i) => (
        <mesh key={i} position={[0, 0.176, z]}>
          <boxGeometry args={[0.06, 0.015, 0.35]} />
          <meshStandardMaterial color="#ffe500" roughness={0.7} emissive="#ccb800" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* ── Bay number ── */}
      <Html position={[-1.7, 0.2, 2.3]} center transform rotation={[-Math.PI / 2, 0, 0]}>
        <div className="font-black text-4xl select-none pointer-events-none" style={{ color: 'rgba(0,0,0,0.18)', letterSpacing: '0.15em' }}>
          {bay.id}
        </div>
      </Html>

      {/* ── Selection glow plane ── */}
      {isSelected && (
        <mesh ref={glowRef} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.5, 5.1]} />
          <meshStandardMaterial
            color={STATUS_COLORS[bay.status] || '#ffe500'}
            emissive={STATUS_COLORS[bay.status] || '#ffe500'}
            emissiveIntensity={1.5}
            transparent
            opacity={0.22}
          />
        </mesh>
      )}

      {/* ── Spinning selection ring ── */}
      {isSelected && (
        <mesh ref={ringRef} position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.1, 2.28, 80]} />
          <meshStandardMaterial
            color="#ffe500"
            emissive="#ffd000"
            emissiveIntensity={3}
            transparent
            opacity={0.95}
          />
        </mesh>
      )}

      {/* ── Realistic car ── */}
      {isOccupied && <BayVehicle bay={bay} isSelected={isSelected} />}

      {/* ── Overhead status light ── */}
      {bay.status === 'overdue' && (
        <pointLight position={[0, 3.2, 0]} color="#ff3333" intensity={isSelected ? 8 : 3} distance={6} />
      )}
      {bay.status === 'ready' && (
        <pointLight position={[0, 3.2, 0]} color="#44aaff" intensity={isSelected ? 5 : 1.8} distance={6} />
      )}
      {bay.status === 'occupied' && (
        <pointLight position={[0, 3.2, 0]} color="#ffe066" intensity={isSelected ? 3 : 0.8} distance={5} />
      )}
    </group>
  );
}

// ─── Garage Structure – walls, columns, ceiling rig ───────────────────────
function GarageStructure() {
  return (
    <group>
      {/* Polished concrete floor base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0.5]} receiveShadow>
        <planeGeometry args={[32, 22]} />
        <meshStandardMaterial color="#9aa0a8" roughness={0.55} metalness={0.12} />
      </mesh>

      {/* ── Back wall (light grey) ── */}
      <mesh position={[0, 3.5, -8.0]} receiveShadow>
        <boxGeometry args={[18, 8, 0.3]} />
        <meshStandardMaterial color="#d8dee4" roughness={0.8} />
      </mesh>
      {/* Wainscot stripe */}
      <mesh position={[0, 0.85, -7.88]}>
        <boxGeometry args={[18, 1.6, 0.06]} />
        <meshStandardMaterial color="#1e2228" roughness={0.7} />
      </mesh>
      {/* Yellow accent stripe */}
      <mesh position={[0, 1.67, -7.88]}>
        <boxGeometry args={[18, 0.08, 0.05]} />
        <meshStandardMaterial color="#ffe500" emissive="#ccb800" emissiveIntensity={0.8} roughness={0.5} />
      </mesh>

      {/* ── Side walls ── */}
      <mesh position={[-9.2, 3.5, 0.5]} receiveShadow>
        <boxGeometry args={[0.3, 8, 22]} />
        <meshStandardMaterial color="#c8d2d8" roughness={0.8} />
      </mesh>
      <mesh position={[9.2, 3.5, 0.5]} receiveShadow>
        <boxGeometry args={[0.3, 8, 22]} />
        <meshStandardMaterial color="#c8d2d8" roughness={0.8} />
      </mesh>

      {/* ── Columns Removed ── */}

      {/* ── Overhead LED light rigs ── */}
      {[-5.5, 0, 5.5].map((x, i) => (
        <group key={`rig-${i}`} position={[x, 6.0, 0.5]}>
          {/* Housing bar */}
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.1, 10]} />
            <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* LED strip diffuser */}
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[0.14, 0.04, 9.6]} />
            <meshStandardMaterial color="#ffffff" emissive="#fffbe0" emissiveIntensity={2.5} roughness={0.6} />
          </mesh>
          {/* Suspender cables */}
          {[-4, -2, 0, 2, 4].map((z, j) => (
            <mesh key={j} position={[0, 0.4, z]}>
              <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
              <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
          {/* Actual light source */}
          <pointLight position={[0, -0.5, 0]} color="#fff8e8" intensity={12} distance={12} castShadow shadow-mapSize={[512, 512]} />
        </group>
      ))}

      {/* ── Ceiling beams ── */}
      {[-3.5, 0.5, 4.5].map((z, i) => (
        <mesh key={`beam-${i}`} position={[0, 6.2, z]} castShadow>
          <boxGeometry args={[18.4, 0.28, 0.28]} />
          <meshStandardMaterial color="#38404e" metalness={0.5} roughness={0.6} />
        </mesh>
      ))}

      {/* ── Tool cabinet (back wall decoration) ── */}
      {[-6.5, 0, 6.5].map((x, i) => (
        <group key={`cab-${i}`} position={[x, 1.2, -7.72]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 2.2, 0.5]} />
            <meshStandardMaterial color="#d04000" roughness={0.6} metalness={0.3} />
          </mesh>
          {/* Drawer handles */}
          {[-0.6, 0, 0.6].map((dy, j) => (
            <mesh key={j} position={[0, dy, 0.28]}>
              <boxGeometry args={[1.4, 0.06, 0.04]} />
              <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── Status metadata ───────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; icon: any; bg: string; text: string; border: string }> = {
  empty:    { label: 'Empty',    icon: MapPin,        bg: 'bg-slate-100',    text: 'text-slate-500',  border: 'border-slate-300' },
  occupied: { label: 'In Service', icon: Wrench,      bg: 'bg-yellow-400',  text: 'text-[#1a1a1a]', border: 'border-[#1a1a1a]' },
  overdue:  { label: 'Urgent',   icon: AlertTriangle, bg: 'bg-red-600',     text: 'text-white',      border: 'border-red-700' },
  ready:    { label: 'Ready',    icon: CheckCircle2,  bg: 'bg-blue-500',    text: 'text-white',      border: 'border-blue-700' },
};

export default function GarageMapPage() {
  const [bays, setBays] = useState(INITIAL_BAYS.map(b => ({ ...b, makeModel: '' })));
  const [selectedBay, setSelectedBay] = useState<any>(null);

  // ── Data load (unchanged) ──────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function load() {
      const woData = await withClientCache('garage-map:work-orders', 4_000, async () => {
        const { data, error } = await supabase
          .from('work_orders')
          .select(`id, status, type, priority, plate, assigned_mechanic_id, vehicles (make, model, color, scan_3d_data), appointments (bay), staff_profiles (name)`)
          .not('status', 'eq', 'DELIVERED');
        if (error) throw error;
        return data || [];
      });

      if (woData) {
        setBays(prev => prev.map(bay => {
          const activeWo = woData.find((w: any) => {
            if (Array.isArray(w.appointments)) return w.appointments.some((a: any) => a.bay === `Bay ${bay.id}`);
            return w.appointments?.bay === `Bay ${bay.id}`;
          });
          if (activeWo) {
            const vehicleRow = Array.isArray(activeWo.vehicles) ? (activeWo.vehicles as any)[0] : (activeWo.vehicles as any);
            const vMake = vehicleRow?.make || '';
            const vModel = vehicleRow?.model || '';
            const tName = Array.isArray(activeWo.staff_profiles) ? (activeWo.staff_profiles as any)[0]?.name : (activeWo.staff_profiles as any)?.name || 'Unassigned';
            let bStatus = 'occupied';
            if (activeWo.status === 'READY') bStatus = 'ready';
            if (activeWo.priority === 'urgent' || activeWo.priority === 'critical') bStatus = 'overdue';
            const scannedColor = vehicleRow?.scan_3d_data?.color;
            const statusFallbackColor =
              bStatus === 'overdue' ? '#c0392b' :
              bStatus === 'ready' ? '#1a5fa8' :
              bStatus === 'occupied' ? '#1a1a1a' : '#555';
            const carColor = vehicleRow?.color || scannedColor || statusFallbackColor;
            return { ...bay, status: bStatus, vehicle: activeWo.plate, makeModel: `${vMake} ${vModel}`.trim() || 'Vehicle', type: activeWo.type, mechanic: tName, time: activeWo.status, carColor };
          }
          return { ...bay, status: 'empty', vehicle: '', makeModel: '', type: '', mechanic: '', time: '', carColor: '' };
        }));
      }
    }

    const poll = async () => {
      if (!active) return;
      if (document.visibilityState === 'visible') {
        await load();
      }
      timer = setTimeout(poll, document.visibilityState === 'visible' ? 8_000 : 30_000);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void load();
      }
    };

    void poll();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const counts = {
    empty:    bays.filter(b => b.status === 'empty').length,
    occupied: bays.filter(b => b.status === 'occupied').length,
    overdue:  bays.filter(b => b.status === 'overdue').length,
    ready:    bays.filter(b => b.status === 'ready').length,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b-4 border-[#1a1a1a] pb-4 mb-4 shrink-0">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">Garage Floor Plan</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live · 6 Bays · Auto-refresh every few seconds
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(counts).map(([status, count]) => {
            const meta = STATUS_META[status];
            return (
              <div key={status} className={`flex items-center gap-2 px-4 py-2 border-2 font-black uppercase text-sm tracking-widest ${meta.bg} ${meta.text} ${meta.border}`}>
                <meta.icon size={15} strokeWidth={2.5} />
                {count} {meta.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3D Canvas + Panel ── */}
      <div className="flex-1 min-h-0 border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] relative overflow-hidden">

        <Canvas
          shadows="soft"
          dpr={[1, 1.15]}
          camera={{ position: [0, 15, 16], fov: 40, near: 0.1, far: 300 }}
          gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
          performance={{ min: 0.5 }}
          onPointerMissed={() => setSelectedBay(null)}
        >
          <color attach="background" args={['#ffffff']} />
          {/* ── No fog ── */}

          {/* ── Lighting ── */}
          <ambientLight intensity={0.55} color="#ccd4e8" />
          <directionalLight
            position={[14, 24, 12]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-16}
            shadow-camera-right={16}
            shadow-camera-top={14}
            shadow-camera-bottom={-14}
            shadow-bias={-0.0005}
            color="#fff8f0"
          />
          <directionalLight position={[-10, 18, -8]} intensity={0.7} color="#d0e4ff" />

          <Environment preset="warehouse" />

          {/* ── Ground grid ── */}
          <Grid
            position={[0, 0.0, 0.5]}
            args={[32, 22]}
            cellSize={1}
            cellThickness={0.4}
            cellColor="#3a4050"
            sectionSize={5.5}
            sectionThickness={1.2}
            sectionColor="#4a5060"
            fadeDistance={26}
            fadeStrength={1.5}
          />

          {/* ── Structure & cars ── */}
          <GarageStructure />

          {bays.map(bay => (
            <BayMesh
              key={bay.id}
              bay={bay}
              isSelected={selectedBay?.id === bay.id}
              onClick={() => setSelectedBay(bay)}
            />
          ))}

          <ContactShadows position={[0, 0.01, 0.5]} opacity={0.55} scale={32} blur={5} far={6} resolution={1024} color="#000000" />

          <OrbitControls
            makeDefault
            maxPolarAngle={Math.PI / 2.12}
            minDistance={6}
            maxDistance={34}
            target={[0, 0, 0.5]}
            enableDamping
            dampingFactor={0.06}
          />
        </Canvas>

        {/* ── Bay Info Panel ── */}
        {selectedBay && (() => {
          const meta = STATUS_META[selectedBay.status];
          const headerBg =
            selectedBay.status === 'empty'    ? 'bg-slate-800' :
            selectedBay.status === 'overdue'  ? 'bg-red-600'   :
            selectedBay.status === 'ready'    ? 'bg-blue-600'  : 'bg-[#ffe500]';
          const headerText = selectedBay.status === 'occupied' ? 'text-[#1a1a1a]' : selectedBay.status === 'empty' ? 'text-white' : 'text-white';

          return (
            <div className="absolute right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-md border-l-4 border-[#1a1a1a] animate-in slide-in-from-right-6 duration-200 overflow-y-auto flex flex-col shadow-[-12px_0_30px_rgba(0,0,0,0.08)]">
              <div className={`p-5 border-b-2 border-white/10 flex justify-between items-center ${headerBg}`}>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest opacity-70 ${headerText}`}>Garage Bay</p>
                  <h2 className={`text-3xl font-black uppercase tracking-widest ${headerText}`}>Bay {selectedBay.id}</h2>
                </div>
                <button
                  onClick={() => setSelectedBay(null)}
                  className={`p-2 border-2 border-white/30 hover:bg-white/20 transition-colors ${headerText}`}
                >
                  <X size={20} />
                </button>
              </div>

              {selectedBay.status !== 'empty' ? (
                <div className="flex-1 p-5 space-y-4">
                  {/* Plate */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Vehicle</p>
                    <div className="bg-[#ffe500] text-[#1a1a1a] font-mono px-4 py-2 text-xl font-black tracking-widest border-2 border-[#1a1a1a] inline-block shadow-[4px_4px_0_#000]">
                      {selectedBay.vehicle}
                    </div>
                    <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-wider">{selectedBay.makeModel}</p>
                  </div>

                    <div className="grid gap-3">
                      {[
                        { icon: Wrench,       label: 'Job Type',          value: selectedBay.type    || '—' },
                        { icon: User,         label: 'Assigned Mechanic', value: selectedBay.mechanic || '—' },
                        { icon: Clock,        label: 'Status',            value: selectedBay.time    || selectedBay.status },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                            <Icon size={9} /> {label}
                          </p>
                          <p className="font-black text-[#1a1a1a] uppercase text-sm">{value}</p>
                        </div>
                      ))}
                    </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-2 px-3 py-2 border-2 w-fit font-black uppercase text-xs tracking-widest ${meta.bg} ${meta.text} ${meta.border}`}>
                    <meta.icon size={13} strokeWidth={2.5} />
                    {meta.label}
                  </div>

                  {selectedBay.status === 'overdue' && (
                    <div className="bg-red-900/30 border-2 border-red-600 p-3 flex items-center gap-3">
                      <AlertTriangle size={20} className="text-red-400 shrink-0" />
                      <p className="text-sm font-bold text-red-300 uppercase">Urgent attention needed!</p>
                    </div>
                  )}
                  {selectedBay.status === 'ready' && (
                    <div className="bg-blue-900/30 border-2 border-blue-500 p-3 flex items-center gap-3">
                      <CheckCircle2 size={20} className="text-blue-400 shrink-0" />
                      <p className="text-sm font-bold text-blue-300 uppercase">Ready for collection</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 border-4 border-dashed border-gray-600 flex items-center justify-center mb-4">
                    <MapPin size={36} className="text-gray-600" />
                  </div>
                  <h3 className="font-black uppercase text-xl text-gray-500 mb-2">Bay {selectedBay.id} Free</h3>
                  <p className="font-bold text-sm text-gray-600 uppercase tracking-wider">Ready for next assignment</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Click hint ── */}
        {!selectedBay && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur border border-white/20 px-5 py-2.5 font-black text-xs uppercase tracking-widest text-white/80 pointer-events-none flex items-center gap-2">
            <Zap size={12} className="text-[#ffe500]" />
            Click a bay to inspect · Drag to rotate · Scroll to zoom
          </div>
        )}
      </div>
    </div>
  );
}
