'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Html, OrbitControls } from '@react-three/drei';
import { CarMesh } from '@/components/3d/CarMesh';

function LoaderFallback() {
  return (
    <Html center>
      <div className="bg-[#1a1a1a] text-electricYellow px-4 py-2 border-2 border-electricYellow font-black uppercase tracking-widest text-xs">
        Loading Camaro…
      </div>
    </Html>
  );
}

export function VehicleViewer({ modelUrl: _modelUrl }: { modelUrl?: string }) {
  return (
    <Canvas shadows camera={{ position: [6, 2.4, 7], fov: 40 }}>
      <Suspense fallback={<LoaderFallback />}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[8, 12, 8]} intensity={2.1} castShadow />
        <Environment preset="city" />

        <CarMesh autoRotate color="#5f6c79" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
          <planeGeometry args={[28, 28]} />
          <meshStandardMaterial color="#e8ebef" roughness={0.72} metalness={0.1} />
        </mesh>

        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.65} minDistance={3} maxDistance={18} />
      </Suspense>
    </Canvas>
  );
}
