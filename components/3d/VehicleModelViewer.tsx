'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { CarMesh } from '@/components/3d/CarMesh';

interface VehicleModelViewerProps {
  color?: string;
  scaleX?: number;
  scaleZ?: number;
  autoRotate?: boolean;
  showControls?: boolean;
  className?: string;
  info?: { label: string; value: string }[];
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="bg-white border-4 border-[#1a1a1a] px-4 py-3 shadow-[6px_6px_0_#1a1a1a]">
        <p className="font-black uppercase tracking-widest text-sm text-[#1a1a1a]">Loading Camaro 3D…</p>
      </div>
    </Html>
  );
}

function ModelLoadFallback({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[1.8, 0.8, 4.2]} />
        <meshStandardMaterial color={color} metalness={0.72} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.9, 0.18, 4.3]} />
        <meshStandardMaterial color="#111" roughness={0.82} />
      </mesh>
    </group>
  );
}

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
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
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [6.2, 2.5, 7.5], fov: 36 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <color attach="background" args={['#f6f7f8']} />

          <ambientLight intensity={0.3} color="#d8e4ff" />
          <directionalLight
            position={[8, 12, 8]}
            intensity={1.9}
            color="#fff7ea"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={30}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <pointLight position={[-7, 3, -3]} intensity={0.8} color="#bfd6ff" />
          <pointLight position={[4, 2, 9]} intensity={0.8} color="#ffe3ba" />

          <Environment preset="city" />

          <SceneErrorBoundary fallback={<ModelLoadFallback color={color} />}>
            <CarMesh color={color} scaleX={scaleX} scaleZ={scaleZ} autoRotate={autoRotate} />
          </SceneErrorBoundary>

          <ContactShadows
            position={[0, -0.001, 0]}
            opacity={0.28}
            scale={15}
            blur={2}
            far={6}
            color="#000000"
          />

          <Grid
            position={[0, -0.002, 0]}
            args={[26, 26]}
            cellSize={1}
            cellThickness={0.18}
            cellColor="#dfe3e8"
            sectionSize={5}
            sectionThickness={0.5}
            sectionColor="#cfd5db"
            fadeDistance={18}
            fadeStrength={1.5}
            infiniteGrid
          />

          {showControls && (
            <OrbitControls
              makeDefault
              autoRotate={autoRotate}
              autoRotateSpeed={0.7}
              minDistance={3.3}
              maxDistance={20}
              minPolarAngle={0.08}
              maxPolarAngle={Math.PI / 2.05}
              enableDamping
              dampingFactor={0.06}
            />
          )}
        </Suspense>
      </Canvas>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white border-2 border-[#1a1a1a] px-3 py-2 shadow-[4px_4px_0_#1a1a1a]">
        <div className="w-5 h-5 border-2 border-[#1a1a1a]" style={{ backgroundColor: color }} />
        <span className="font-mono text-xs font-black uppercase tracking-wider text-[#1a1a1a]">{color}</span>
      </div>

      {info && info.length > 0 && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {info.map((item) => (
            <div key={item.label} className="bg-white border-2 border-[#1a1a1a] px-4 py-2 shadow-[4px_4px_0_#1a1a1a] text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
              <p className="text-sm font-black tracking-wider text-[#1a1a1a]">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
