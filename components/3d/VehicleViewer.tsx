'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CarMesh } from '@/components/3d/CarMesh';
import { createOptimizedRenderer } from '@/components/3d/createOptimizedRenderer';

export function VehicleViewer({ modelUrl: _modelUrl }: { modelUrl?: string }) {
  return (
    <Canvas
      dpr={1}
      shadows={false}
      camera={{ position: [6, 2.2, 7], fov: 40 }}
      gl={createOptimizedRenderer}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 10, 6]} intensity={1.1} />
      <pointLight position={[-6, 2, -4]} intensity={0.45} />

      <CarMesh autoRotate color="#5f6c79" offsetZ={0.35} />

      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.6} minDistance={3} maxDistance={16} />
    </Canvas>
  );
}
