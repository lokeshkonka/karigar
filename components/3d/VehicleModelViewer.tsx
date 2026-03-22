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
        dpr={[1, 1.25]}
        camera={{ position: [6, 2.3, 7.2], fov: 38 }}
        gl={createOptimizedRenderer}
        frameloop={autoRotate ? 'always' : 'demand'}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 10, 7]} intensity={1.15} />
        <pointLight position={[-6, 2, -4]} intensity={0.45} />

        <CarMesh color={color} scaleX={scaleX} scaleZ={scaleZ} autoRotate={autoRotate} offsetZ={0.8} />

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
    </div>
  );
}
