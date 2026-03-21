'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html, Environment } from '@react-three/drei';

function Model({ url }: { url: string }) {
  // Try loading if a real URL is provided, otherwise fallback to basic geometry for demo
  try {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
  } catch (e) {
    // Demo fallback Box if model fails or isn't yet physically provided
    return (
      <mesh>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color="#FFE500" roughness={0.2} metalness={0.8} />
      </mesh>
    );
  }
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-neo border-t-electricYellow rounded-full animate-spin"></div>
        <p className="mt-4 font-black uppercase tracking-widest text-white text-sm">Loading 3D Mesh...</p>
      </div>
    </Html>
  );
}

export function VehicleViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <Canvas shadows camera={{ position: [4, 2, 6], fov: 45 }}>
      <Suspense fallback={<LoadingFallback />}>
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        <Environment preset="city" />
        
        {/* The Model */}
        <Stage adjustCamera intensity={0.5}>
          <Model url={modelUrl} />
        </Stage>
        
        <OrbitControls 
          makeDefault 
          autoRotate 
          autoRotateSpeed={0.5} 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2} 
        />
      </Suspense>
    </Canvas>
  );
}
