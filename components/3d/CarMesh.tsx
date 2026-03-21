'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CarMeshProps {
  color: string;
  scaleX?: number;
  scaleZ?: number;
  wireframe?: boolean;
  autoRotate?: boolean;
}

/**
 * High-fidelity parametric car mesh — sedan silhouette with:
 * - Tapered cabin, sloped hood & trunk
 * - Alloy rims with 5 spokes, brake discs
 * - Door panel crease line
 * - Roof rails, spoiler lip
 * - Glowing headlights & tail lights
 * - Realistic material reflections
 */
export function CarMesh({ color, scaleX = 1, scaleZ = 1, wireframe = false, autoRotate = true }: CarMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyColor = useMemo(() => new THREE.Color(color), [color]);

  /* ─── Materials ───────────────────────────────────────────────────── */
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: bodyColor,
    metalness: 0.72,
    roughness: 0.28,
    wireframe,
  }), [bodyColor, wireframe]);

  const darkBodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: bodyColor.clone().multiplyScalar(0.55),
    metalness: 0.3,
    roughness: 0.6,
  }), [bodyColor]);

  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#b8d4f0',
    metalness: 0.0,
    roughness: 0.02,
    transparent: true,
    opacity: 0.28,
    transmission: 0.92,
    ior: 1.5,
  }), []);

  const blackMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0d0d0d',
    metalness: 0.12,
    roughness: 0.85,
  }), []);

  const tyreMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#111111',
    metalness: 0.0,
    roughness: 0.95,
  }), []);

  const rimMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#cccccc',
    metalness: 0.98,
    roughness: 0.08,
    envMapIntensity: 1.5,
  }), []);

  const brakeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#888888',
    metalness: 0.7,
    roughness: 0.3,
  }), []);

  const headlightMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#fff4cc',
    emissiveIntensity: 2.2,
  }), []);

  const tailLightMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ff1500',
    emissive: '#ff0000',
    emissiveIntensity: 3.0,
  }), []);

  const chromeAccentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e0e0e0',
    metalness: 1.0,
    roughness: 0.05,
  }), []);

  /* ─── Auto-rotate ─────────────────────────────────────────────────── */
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.28;
    }
  });

  /* ─── Car dimensions ─────────────────────────────────────────────── */
  const W = 1.76 * scaleX;   // width
  const L = 4.3  * scaleZ;   // length
  const BY = 0.34;            // bottom body Y centre
  const BH = 0.52;            // lower body height
  const CY = 0.72;            // cabin base Y
  const CH = 0.52;            // cabin height
  const CL = 2.1;             // cabin length
  const WR = 0.32;            // wheel radius
  const WW = 0.22;            // wheel width

  /* ─── Wheel positions ────────────────────────────────────────────── */
  const wheelPositions: [number, number, number][] = [
    [ W / 2 + 0.06, WR, L / 2 - 0.88],   // FR
    [-W / 2 - 0.06, WR, L / 2 - 0.88],   // FL
    [ W / 2 + 0.06, WR, -(L / 2 - 0.88)], // RR
    [-W / 2 - 0.06, WR, -(L / 2 - 0.88)], // RL
  ];

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>

      {/* ── UNDERCARRIAGE ── */}
      <mesh material={blackMat} position={[0, 0.09, 0]}>
        <boxGeometry args={[W - 0.08, 0.12, L - 0.28]} />
      </mesh>

      {/* ── LOWER BODY ── */}
      <mesh material={bodyMat} position={[0, BY, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, BH, L]} />
      </mesh>

      {/* Front overhang / hood slope base */}
      <mesh material={bodyMat} position={[0, BY + 0.06, L * 0.38]} castShadow>
        <boxGeometry args={[W - 0.06, BH - 0.1, 0.44]} />
      </mesh>

      {/* Rear overhang */}
      <mesh material={bodyMat} position={[0, BY + 0.02, -L * 0.38]} castShadow>
        <boxGeometry args={[W - 0.04, BH - 0.14, 0.42]} />
      </mesh>

      {/* ── HOOD ── (sloped slightly at front) */}
      <mesh material={bodyMat} position={[0, BY + BH / 2 + 0.06, L * 0.18]} castShadow>
        <boxGeometry args={[W - 0.04, 0.08, L * 0.36]} />
      </mesh>
      {/* Hood crease ridge */}
      <mesh material={chromeAccentMat} position={[0, BY + BH / 2 + 0.11, L * 0.18]}>
        <boxGeometry args={[0.04, 0.02, L * 0.34]} />
      </mesh>

      {/* ── TRUNK LID ── */}
      <mesh material={bodyMat} position={[0, BY + BH / 2 + 0.05, -L * 0.2]} castShadow>
        <boxGeometry args={[W - 0.04, 0.07, L * 0.3]} />
      </mesh>

      {/* ── CABIN ── */}
      <mesh material={bodyMat} position={[0, CY + CH / 2, -0.08]} castShadow>
        <boxGeometry args={[W - 0.14, CH, CL]} />
      </mesh>

      {/* Roof (slightly narrower, rounded via scale) */}
      <mesh material={bodyMat} position={[0, CY + CH + 0.02, -0.1]} castShadow>
        <boxGeometry args={[W - 0.22, 0.07, CL - 0.28]} />
      </mesh>

      {/* Roof rails */}
      <mesh material={chromeAccentMat} position={[ W / 2 - 0.1, CY + CH + 0.06, -0.1]}>
        <boxGeometry args={[0.03, 0.03, CL - 0.28]} />
      </mesh>
      <mesh material={chromeAccentMat} position={[-W / 2 + 0.1, CY + CH + 0.06, -0.1]}>
        <boxGeometry args={[0.03, 0.03, CL - 0.28]} />
      </mesh>

      {/* A-pillar (front cabin post) */}
      <mesh material={bodyMat} position={[ W / 2 - 0.09, CY + CH * 0.45, CL / 2 - 0.08]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[0.06, CH * 0.9, 0.06]} />
      </mesh>
      <mesh material={bodyMat} position={[-W / 2 + 0.09, CY + CH * 0.45, CL / 2 - 0.08]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[0.06, CH * 0.9, 0.06]} />
      </mesh>

      {/* C-pillar (rear) */}
      <mesh material={bodyMat} position={[ W / 2 - 0.09, CY + CH * 0.45, -CL / 2 + 0.08]} rotation={[-0.28, 0, 0]}>
        <boxGeometry args={[0.06, CH * 0.9, 0.06]} />
      </mesh>
      <mesh material={bodyMat} position={[-W / 2 + 0.09, CY + CH * 0.45, -CL / 2 + 0.08]} rotation={[-0.28, 0, 0]}>
        <boxGeometry args={[0.06, CH * 0.9, 0.06]} />
      </mesh>

      {/* ── WINDSHIELDS ── */}
      {/* Front */}
      <mesh material={glassMat} position={[0, CY + CH * 0.48, CL / 2 - 0.03]} rotation={[-0.42, 0, 0]}>
        <boxGeometry args={[W - 0.28, CH * 0.78, 0.04]} />
      </mesh>
      {/* Rear */}
      <mesh material={glassMat} position={[0, CY + CH * 0.44, -CL / 2 + 0.03]} rotation={[0.36, 0, 0]}>
        <boxGeometry args={[W - 0.28, CH * 0.7, 0.04]} />
      </mesh>
      {/* Side windows left */}
      <mesh material={glassMat} position={[-(W / 2 - 0.076), CY + CH * 0.55, -0.08]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[CL - 0.56, CH * 0.65, 0.02]} />
      </mesh>
      {/* Side windows right */}
      <mesh material={glassMat} position={[(W / 2 - 0.076), CY + CH * 0.55, -0.08]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[CL - 0.56, CH * 0.65, 0.02]} />
      </mesh>

      {/* ── DOOR CREASE LINE ── */}
      <mesh material={darkBodyMat} position={[ W / 2 + 0.005, BY + BH * 0.55, 0]}>
        <boxGeometry args={[0.012, 0.04, L * 0.7]} />
      </mesh>
      <mesh material={darkBodyMat} position={[-W / 2 - 0.005, BY + BH * 0.55, 0]}>
        <boxGeometry args={[0.012, 0.04, L * 0.7]} />
      </mesh>

      {/* ── BUMPERS ── */}
      <mesh material={blackMat} position={[0, BY - 0.04, L / 2 + 0.05]} castShadow>
        <boxGeometry args={[W + 0.04, 0.16, 0.16]} />
      </mesh>
      <mesh material={blackMat} position={[0, BY - 0.04, -L / 2 - 0.05]} castShadow>
        <boxGeometry args={[W + 0.04, 0.16, 0.16]} />
      </mesh>

      {/* ── GRILLE ── */}
      <mesh material={blackMat} position={[0, BY + 0.05, L / 2 + 0.06]}>
        <boxGeometry args={[W * 0.52, 0.14, 0.04]} />
      </mesh>
      <mesh material={chromeAccentMat} position={[0, BY + 0.05, L / 2 + 0.07]}>
        <boxGeometry args={[W * 0.52, 0.02, 0.02]} />
      </mesh>
      {/* Grille bars */}
      {[-0.16, 0, 0.16].map((x, i) => (
        <mesh key={i} material={chromeAccentMat} position={[x, BY + 0.05, L / 2 + 0.08]}>
          <boxGeometry args={[0.012, 0.13, 0.02]} />
        </mesh>
      ))}

      {/* ── HEADLIGHTS ── */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[side * (W / 2 - 0.2), BY + 0.22, L / 2 + 0.075]}>
          <mesh material={headlightMat}>
            <boxGeometry args={[0.3, 0.11, 0.03]} />
          </mesh>
          {/* DRL strip */}
          <mesh material={headlightMat} position={[0, -0.08, 0]}>
            <boxGeometry args={[0.28, 0.025, 0.03]} />
          </mesh>
          <pointLight color="#fff4cc" intensity={1.8} distance={3.5} position={[0, 0, 0.2]} />
        </group>
      ))}

      {/* ── TAIL LIGHTS ── */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[side * (W / 2 - 0.2), BY + 0.22, -L / 2 - 0.06]}>
          <mesh material={tailLightMat}>
            <boxGeometry args={[0.32, 0.1, 0.03]} />
          </mesh>
          {/* Tail light strip */}
          <mesh material={tailLightMat} position={[0, -0.07, 0]}>
            <boxGeometry args={[0.3, 0.025, 0.03]} />
          </mesh>
          <pointLight color="#ff1500" intensity={0.8} distance={2} position={[0, 0, -0.1]} />
        </group>
      ))}

      {/* Centre brake light */}
      <mesh material={tailLightMat} position={[0, CY + CH - 0.06, -CL / 2 - 0.05]}>
        <boxGeometry args={[0.28, 0.04, 0.02]} />
      </mesh>

      {/* ── REAR SPOILER LIP ── */}
      <mesh material={bodyMat} position={[0, BY + BH / 2 + 0.1, -L / 2 + 0.1]} castShadow>
        <boxGeometry args={[W - 0.1, 0.07, 0.12]} />
      </mesh>

      {/* ── SIDE MIRRORS ── */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[side * (W / 2 + 0.10), CY + 0.06, CL / 2 - 0.26]}>
          <mesh material={bodyMat}>
            <boxGeometry args={[0.12, 0.09, 0.18]} />
          </mesh>
          <mesh material={glassMat} position={[side * 0.065, 0, 0]}>
            <boxGeometry args={[0.01, 0.07, 0.14]} />
          </mesh>
        </group>
      ))}

      {/* ── DOOR HANDLES ── */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[side * (W / 2 + 0.008), BY + 0.35, 0.1]}>
          <mesh material={chromeAccentMat}>
            <boxGeometry args={[0.025, 0.04, 0.16]} />
          </mesh>
        </group>
      ))}

      {/* ── WHEELS ── */}
      {wheelPositions.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          {/* Tyre outer */}
          <mesh material={tyreMat} castShadow>
            <cylinderGeometry args={[WR, WR, WW, 32]} />
          </mesh>
          {/* Tyre inner wall */}
          <mesh material={tyreMat}>
            <cylinderGeometry args={[WR * 0.72, WR * 0.72, WW + 0.01, 32]} />
          </mesh>
          {/* Alloy dish */}
          <mesh material={rimMat} position={[x > 0 ? 0.06 : -0.06, 0, 0]}>
            <cylinderGeometry args={[WR * 0.68, WR * 0.68, 0.04, 32]} />
          </mesh>
          {/* 5 spokes */}
          {[0, 1, 2, 3, 4].map(s => {
            const angle = (s / 5) * Math.PI * 2;
            return (
              <mesh key={s} material={rimMat} position={[x > 0 ? 0.065 : -0.065, Math.sin(angle) * WR * 0.38, Math.cos(angle) * WR * 0.38]}>
                <boxGeometry args={[0.04, 0.05, WR * 0.56]} />
              </mesh>
            );
          })}
          {/* Brake disc */}
          <mesh material={brakeMat} position={[x > 0 ? -0.04 : 0.04, 0, 0]}>
            <cylinderGeometry args={[WR * 0.5, WR * 0.5, 0.03, 20]} />
          </mesh>
          {/* Centre hub cap */}
          <mesh material={chromeAccentMat} position={[x > 0 ? 0.09 : -0.09, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.06, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
