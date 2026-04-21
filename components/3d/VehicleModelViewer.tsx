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
  autoRotate = false,
  showControls = true,
  className = '',
  info,
}: VehicleModelViewerProps) {
  const webglSupported =
    typeof window === 'undefined'
      ? true
      : (() => {
          try {
            const canvas = document.createElement('canvas');
            return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
          } catch {
            return false;
          }
        })();

  if (!webglSupported) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="h-full w-full bg-[#f4f4f4] border-2 border-[#1a1a1a] flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-28 h-16 mx-auto border-2 border-[#1a1a1a]" style={{ backgroundColor: color }} />
            <p className="mt-3 text-xs font-black uppercase tracking-wider text-[#1a1a1a]">3D preview unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows={false}
        dpr={[1, 1.15]}
        camera={{ position: [6, 2.6, 7.8], fov: 38 }}
        gl={createOptimizedRenderer}
        frameloop="always"
        performance={{ min: 0.5 }}
        fallback={
          <div className="h-full w-full bg-[#111] text-gray-500 flex items-center justify-center font-black text-xs uppercase tracking-wider">
            3D preview not supported on this browser
          </div>
        }
        onCreated={({ gl }) => {
          gl.setClearColor(0xf4f4f4, 1);
        }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[6, 10, 7]} intensity={1.25} />
        <pointLight position={[-5, 3, -3]} intensity={0.5} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#d7d7d7" roughness={0.92} metalness={0.02} />
        </mesh>

        <CarMesh color={color} scaleX={scaleX} scaleZ={scaleZ} autoRotate={autoRotate} offsetY={0.02} offsetZ={0.2} />

        {showControls && (
          <OrbitControls
            makeDefault
            autoRotate={false}
            minDistance={3}
            maxDistance={16}
            minPolarAngle={0.18}
            maxPolarAngle={Math.PI / 2.05}
            enableDamping
            dampingFactor={0.07}
          />
        )}
      </Canvas>
    </div>
  );
}
