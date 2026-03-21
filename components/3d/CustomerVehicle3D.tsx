'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import so Three.js doesn't break SSR
const VehicleModelViewer = dynamic(
  () => import('@/components/3d/VehicleModelViewer').then(m => m.VehicleModelViewer),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#111] flex items-center justify-center text-gray-600 font-black uppercase text-sm">Loading 3D...</div> }
);

interface CustomerVehicle3DProps {
  color: string;
  plate: string;
  make: string;
  model: string;
}

export function CustomerVehicle3D({ color, plate, make, model }: CustomerVehicle3DProps) {
  return (
    <div className="w-full h-64 border-4 border-[#1a1a1a] overflow-hidden">
      <VehicleModelViewer
        color={color}
        autoRotate={true}
        info={[
          { label: 'Vehicle', value: `${make} ${model}` },
          { label: 'Plate', value: plate },
        ]}
      />
    </div>
  );
}
