'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CarMesh } from '@/components/3d/CarMesh';
import { createOptimizedRenderer } from '@/components/3d/createOptimizedRenderer';

interface VehicleModelViewerProps {
  color?: string;
  scaleX?: number;
  scaleZ?: number;
  autoRotate?: boolean;
  showControls?: boolean;
  className?: string;
  info?: { label: string; value: string }[];
}

export function VehicleModelViewer({
  color = '#888888',
  scaleX = 1,
  scaleZ = 1,
  autoRotate = true,
  showControls = true,
  className = '',
  info,
}: VehicleModelViewerProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows={false}
        dpr={1}
        camera={{ position: [6, 2.3, 7.2], fov: 38 }}
        gl={createOptimizedRenderer}
        frameloop={autoRotate ? 'always' : 'demand'}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 10, 7]} intensity={1.15} />
        <pointLight position={[-6, 2, -4]} intensity={0.45} />

        <CarMesh color={color} scaleX={scaleX} scaleZ={scaleZ} autoRotate={autoRotate} />

        {showControls && (
          <OrbitControls
            makeDefault
            autoRotate={autoRotate}
            autoRotateSpeed={0.65}
            minDistance={3}
            maxDistance={16}
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI / 2.05}
            enableDamping
            dampingFactor={0.07}
          />
        )}
      </Canvas>

      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 shadow-[3px_3px_0_#1a1a1a]">
        <div className="w-4 h-4 border border-[#1a1a1a]" style={{ backgroundColor: color }} />
        <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]">{color}</span>
      </div>

      {info && info.length > 0 && (
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {info.map((item) => (
            <div key={item.label} className="bg-white border-2 border-[#1a1a1a] px-3 py-2 shadow-[3px_3px_0_#1a1a1a] text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
              <p className="text-xs font-black tracking-wider text-[#1a1a1a]">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
