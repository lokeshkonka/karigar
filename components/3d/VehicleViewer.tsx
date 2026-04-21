'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CarMesh } from '@/components/3d/CarMesh';
import { createOptimizedRenderer } from '@/components/3d/createOptimizedRenderer';

export function VehicleViewer({ modelUrl: _modelUrl }: { modelUrl?: string }) {
  return (
    <Canvas
      dpr={[1, 1.15]}
      shadows={false}
      camera={{ position: [6, 2.6, 7.8], fov: 40 }}
      gl={createOptimizedRenderer}
      performance={{ min: 0.5 }}
      fallback={
        <div className="h-full w-full bg-[#111] text-gray-500 flex items-center justify-center font-black text-xs uppercase tracking-wider">
          3D preview not supported on this browser
        </div>
      }
    >
      <ambientLight intensity={1} />
      <directionalLight position={[6, 10, 6]} intensity={1.2} />
      <pointLight position={[-6, 2, -4]} intensity={0.45} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#d7d7d7" roughness={0.92} metalness={0.02} />
      </mesh>

      <CarMesh autoRotate={false} color="#5f6c79" offsetY={0.02} offsetZ={0.2} />

      <OrbitControls makeDefault autoRotate={false} minDistance={3} maxDistance={16} minPolarAngle={0.18} maxPolarAngle={Math.PI / 2.05} />
    </Canvas>
  );
}
