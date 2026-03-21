'use client';

import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls, Environment, ContactShadows, Html, Grid,
  MeshReflectorMaterial, AccumulativeShadows, RandomizedLight,
  Sparkles,
} from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// WHEEL  –  correct anatomy:
//   1. Tyre  = fat cylinder (rubber), NOT a torus
//   2. Rim   = smaller cylinder inside, recessed, with disc face + spokes
//   3. Brake = disc + caliper peeking through spokes
//
// The group sits upright (Y = axle direction).
// Call-site rotates it 90° on Z so axle points along X.
// ─────────────────────────────────────────────────────────────────────────────
function Wheel({ flip = false }: { flip?: boolean }) {
  const s    = flip ? -1 : 1;    // which side the outer face is on
  const TR   = 0.295;            // tyre outer radius  (to road contact)
  const TW   = 0.215;            // tyre section width
  const RR   = 0.195;            // alloy rim radius
  const RW   = 0.155;            // rim face-to-face width (inset inside tyre)
  const SEGS = 64;

  return (
    <group rotation={[0, 0, Math.PI / 2]}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TYRE  (cylinder, NOT torus)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Main tread barrel */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[TR, TR, TW, SEGS, 1, false]} />
        <meshStandardMaterial color="#161616" roughness={0.96} metalness={0.0} />
      </mesh>

      {/* Shoulder bevel – outer face side */}
      <mesh position={[0, s * (TW * 0.5 - 0.012), 0]}>
        <cylinderGeometry args={[TR - 0.016, TR, 0.026, SEGS, 1, false]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Shoulder bevel – inner face side */}
      <mesh position={[0, -s * (TW * 0.5 - 0.012), 0]}>
        <cylinderGeometry args={[TR, TR - 0.016, 0.026, SEGS, 1, false]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Tyre sidewall – outer (flat rubber annulus face) */}
      <mesh position={[0, s * (TW / 2), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RR + 0.008, TR - 0.010, SEGS]} />
        <meshStandardMaterial color="#181818" roughness={0.97} side={THREE.DoubleSide} />
      </mesh>

      {/* Tyre sidewall – inner */}
      <mesh position={[0, -s * (TW / 2), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RR + 0.008, TR - 0.010, SEGS]} />
        <meshStandardMaterial color="#181818" roughness={0.97} side={THREE.DoubleSide} />
      </mesh>

      {/* Tread grooves – 3 circumferential channels milled into the tread */}
      {[-0.065, 0, 0.065].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[TR + 0.0005, TR + 0.0005, 0.014, SEGS, 1, true]} />
          <meshStandardMaterial color="#0c0c0c" roughness={1.0} side={THREE.BackSide} />
        </mesh>
      ))}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ALLOY RIM
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Rim barrel (cylindrical body between two faces) */}
      <mesh>
        <cylinderGeometry args={[RR, RR, RW, SEGS, 1, false]} />
        <meshStandardMaterial color="#b8b8b8" metalness={0.94} roughness={0.08} />
      </mesh>

      {/* Outer face disc (the face you see from outside the car) */}
      <mesh position={[0, s * (RW / 2), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RR, SEGS]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.96} roughness={0.05} />
      </mesh>

      {/* Inner face disc */}
      <mesh position={[0, -s * (RW / 2), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RR, SEGS]} />
        <meshStandardMaterial color="#9a9a9a" metalness={0.88} roughness={0.15} />
      </mesh>

      {/* ── 5 twin-blade spokes ── */}
      {[0, 1, 2, 3, 4].map(i => {
        const angle  = (i / 5) * Math.PI * 2;
        const inset  = s * (RW / 2 - 0.006);
        return (
          <group key={i}
            position={[0, inset, 0]}
            rotation={[Math.PI / 2, angle, 0]}
          >
            {/* Left blade */}
            <mesh position={[RR * 0.48, -0.025, 0]}>
              <boxGeometry args={[RR * 0.84, 0.045, 0.020]} />
              <meshStandardMaterial color="#cccccc" metalness={0.96} roughness={0.06} />
            </mesh>
            {/* Right blade */}
            <mesh position={[RR * 0.48,  0.025, 0]}>
              <boxGeometry args={[RR * 0.84, 0.045, 0.020]} />
              <meshStandardMaterial color="#cccccc" metalness={0.96} roughness={0.06} />
            </mesh>
          </group>
        );
      })}

      {/* ── Hub ── */}
      {/* Hub barrel */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.052, 0.052, RW + 0.015, 24]} />
        <meshStandardMaterial color="#888" metalness={1.0} roughness={0.04} />
      </mesh>

      {/* Hub face cap */}
      <mesh position={[0, s * (RW / 2 + 0.004), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.048, 24]} />
        <meshStandardMaterial color="#1e1e1e" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Lug nuts × 5 */}
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i}
            position={[Math.cos(a) * 0.090, s * (RW / 2 + 0.006), Math.sin(a) * 0.090]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.012, 0.012, 0.028, 6]} />
            <meshStandardMaterial color="#666" metalness={0.95} roughness={0.10} />
          </mesh>
        );
      })}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BRAKE ASSEMBLY  (behind rim)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Vented disc */}
      <mesh position={[0, -s * 0.02, 0]}>
        <cylinderGeometry args={[0.172, 0.172, 0.024, 40, 1, false]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.88} roughness={0.58} />
      </mesh>

      {/* Disc ventilation slots */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i}
            position={[Math.cos(a) * 0.13, -s * 0.02, Math.sin(a) * 0.13]}
            rotation={[Math.PI / 2, a, 0]}
          >
            <boxGeometry args={[0.042, 0.024, 0.014]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
        );
      })}

      {/* Caliper body */}
      <mesh position={[0.20, -s * 0.018, 0]}>
        <boxGeometry args={[0.072, 0.034, 0.115]} />
        <meshStandardMaterial color="#b82010" metalness={0.55} roughness={0.42} />
      </mesh>

      {/* Caliper pistons (2) */}
      {[-0.032, 0.032].map((z, i) => (
        <mesh key={i} position={[0.237, -s * 0.018, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 0.020, 12]} />
          <meshStandardMaterial color="#777" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}

    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WheelMount – positions wheel in car-body local space
// ─────────────────────────────────────────────────────────────────────────────
function WheelMount({ position, flip = false }: { position: [number, number, number]; flip?: boolean }) {
  return (
    <group position={position}>
      <Wheel flip={flip} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAR BODY  –  sedan silhouette
// Y-origin = bottom of tyre / road contact
// Wheels centre at Y = +0.295 (= tyre radius TR)
// Body raised so chassis clears ~0.08 above ground
// ─────────────────────────────────────────────────────────────────────────────
export interface CarMeshProps {
  color?: string;
  scaleX?: number;
  scaleZ?: number;
  autoRotate?: boolean;
}
export function CarMesh({
  color = '#888888',
  scaleX = 1,
  scaleZ = 1,
  autoRotate = false,
}: CarMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.30;
    }
  });

  // Body sits so its floor is ~0.37 from ground (chassis + suspension)
  const BY = 0.37;   // body group Y offset

  return (
    <group ref={groupRef} scale={[scaleX, 1, scaleZ]}>

      {/* ─────────────────────────────────────────────
          BODY GROUP (everything except wheels)
          ───────────────────────────────────────────── */}
      <group position={[0, BY, 0]}>

        {/* ══ LOWER BODY / DOORS ══ */}

        {/* Main body sill block */}
        <mesh castShadow>
          <boxGeometry args={[1.84, 0.34, 4.00]} />
          <meshStandardMaterial color={color} metalness={0.90} roughness={0.11} envMapIntensity={1.9} />
        </mesh>

        {/* Rocker panels (dark under-sill) */}
        {([-0.935, 0.935] as number[]).map((x, i) => (
          <mesh key={i} position={[x, -0.14, 0.1]} castShadow>
            <boxGeometry args={[0.068, 0.14, 3.82]} />
            <meshStandardMaterial color="#111" roughness={0.75} metalness={0.25} />
          </mesh>
        ))}

        {/* ── Door-body character line (raised crease) ── */}
        {([-0.928, 0.928] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.045, -0.08]}>
            <boxGeometry args={[0.020, 0.018, 3.68]} />
            <meshStandardMaterial color={color} metalness={0.95} roughness={0.07} />
          </mesh>
        ))}

        {/* Door handles */}
        {([-0.942, 0.942] as number[]).map((x, i) => (
          <group key={i}>
            {[0.30, -0.44].map((z, j) => (
              <group key={j} position={[x, 0.08, z]}>
                <mesh>
                  <boxGeometry args={[0.030, 0.030, 0.185]} />
                  <meshStandardMaterial color="#c2c2c2" metalness={1.0} roughness={0.04} />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Front bumper */}
        <mesh position={[0, -0.08, 2.06]} castShadow>
          <boxGeometry args={[1.78, 0.22, 0.18]} />
          <meshStandardMaterial color="#141414" roughness={0.68} metalness={0.20} />
        </mesh>

        {/* Chin spoiler / front lip */}
        <mesh position={[0, -0.19, 2.10]}>
          <boxGeometry args={[1.60, 0.035, 0.10]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.85} />
        </mesh>

        {/* Front grille surround – chrome */}
        <mesh position={[0, -0.005, 2.145]}>
          <boxGeometry args={[0.92, 0.152, 0.036]} />
          <meshStandardMaterial color="#999" metalness={1.0} roughness={0.06} />
        </mesh>

        {/* Grille mesh opening */}
        <mesh position={[0, -0.005, 2.156]}>
          <boxGeometry args={[0.84, 0.112, 0.022]} />
          <meshStandardMaterial color="#050505" roughness={0.9} />
        </mesh>

        {/* Grille horizontal bars × 4 */}
        {[-0.04, -0.013, 0.014, 0.040].map((y, i) => (
          <mesh key={i} position={[0, y, 2.158]}>
            <boxGeometry args={[0.82, 0.010, 0.018]} />
            <meshStandardMaterial color="#555" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}

        {/* Rear bumper */}
        <mesh position={[0, -0.09, -2.04]} castShadow>
          <boxGeometry args={[1.80, 0.24, 0.18]} />
          <meshStandardMaterial color="#141414" roughness={0.68} metalness={0.18} />
        </mesh>

        {/* Rear lower diffuser */}
        <mesh position={[0, -0.20, -2.06]}>
          <boxGeometry args={[1.38, 0.036, 0.12]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.88} />
        </mesh>

        {/* ══ HOOD ══ */}

        {/* Main hood panel */}
        <mesh position={[0, 0.185, 1.30]} rotation={[0.048, 0, 0]} castShadow>
          <boxGeometry args={[1.78, 0.048, 1.68]} />
          <meshStandardMaterial color={color} metalness={0.92} roughness={0.09} envMapIntensity={2.1} />
        </mesh>

        {/* Hood front slope (dipping down to headlights) */}
        <mesh position={[0, 0.122, 1.98]} rotation={[0.30, 0, 0]} castShadow>
          <boxGeometry args={[1.74, 0.048, 0.36]} />
          <meshStandardMaterial color={color} metalness={0.91} roughness={0.10} />
        </mesh>

        {/* Cowl / scuttle panel */}
        <mesh position={[0, 0.200, 0.70]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[1.66, 0.030, 0.20]} />
          <meshStandardMaterial color="#0f0f0f" roughness={0.82} />
        </mesh>

        {/* ══ CABIN / GREENHOUSE ══ */}

        {/* Lower door-belt / waistline */}
        <mesh position={[0, 0.46, -0.06]} castShadow>
          <boxGeometry args={[1.84, 0.22, 2.04]} />
          <meshStandardMaterial color={color} metalness={0.88} roughness={0.13} />
        </mesh>

        {/* Upper cabin walls */}
        <mesh position={[0, 0.78, -0.10]} castShadow>
          <boxGeometry args={[1.60, 0.52, 1.80]} />
          <meshStandardMaterial color={color} metalness={0.84} roughness={0.16} />
        </mesh>

        {/* Roof */}
        <mesh position={[0, 1.05, -0.10]} castShadow>
          <boxGeometry args={[1.56, 0.042, 1.76]} />
          <meshStandardMaterial color={color} metalness={0.93} roughness={0.08} envMapIntensity={2.1} />
        </mesh>

        {/* Roof drip channels */}
        {([-0.788, 0.788] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 1.05, -0.10]}>
            <boxGeometry args={[0.022, 0.022, 1.70]} />
            <meshStandardMaterial color="#111" roughness={0.5} metalness={0.5} />
          </mesh>
        ))}

        {/* A-pillars – steeply raked */}
        {([-0.795, 0.795] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.74, 0.82]} rotation={[0.58, 0, 0]} castShadow>
            <boxGeometry args={[0.058, 0.62, 0.072]} />
            <meshStandardMaterial color={color} metalness={0.80} roughness={0.22} />
          </mesh>
        ))}

        {/* B-pillars */}
        {([-0.808, 0.808] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.73, -0.12]}>
            <boxGeometry args={[0.042, 0.54, 0.062]} />
            <meshStandardMaterial color="#161616" roughness={0.6} metalness={0.35} />
          </mesh>
        ))}

        {/* C-pillars – fastback */}
        {([-0.795, 0.795] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.72, -1.08]} rotation={[-0.55, 0, 0]} castShadow>
            <boxGeometry args={[0.058, 0.56, 0.072]} />
            <meshStandardMaterial color={color} metalness={0.80} roughness={0.22} />
          </mesh>
        ))}

        {/* Windshield – raked */}
        <mesh position={[0, 0.77, 0.84]} rotation={[-0.58, 0, 0]}>
          <boxGeometry args={[1.42, 0.56, 0.032]} />
          <meshStandardMaterial color="#4e90c0" transparent opacity={0.18} metalness={0.04} roughness={0.02} side={THREE.DoubleSide} />
        </mesh>
        {/* Windshield tint strip */}
        <mesh position={[0, 0.96, 0.72]} rotation={[-0.58, 0, 0]}>
          <boxGeometry args={[1.42, 0.12, 0.032]} />
          <meshStandardMaterial color="#1a3855" transparent opacity={0.60} roughness={0.04} />
        </mesh>

        {/* Rear glass – fastback slope */}
        <mesh position={[0, 0.74, -1.02]} rotation={[0.52, 0, 0]}>
          <boxGeometry args={[1.42, 0.50, 0.032]} />
          <meshStandardMaterial color="#4e90c0" transparent opacity={0.17} metalness={0.04} roughness={0.02} side={THREE.DoubleSide} />
        </mesh>

        {/* Side windows */}
        {([-0.830, 0.830] as number[]).map((x, i) => (
          <group key={i}>
            {/* Front door glass */}
            <mesh position={[x, 0.78, 0.33]}>
              <boxGeometry args={[0.032, 0.42, 0.76]} />
              <meshStandardMaterial color="#4e90c0" transparent opacity={0.18} roughness={0.02} side={THREE.DoubleSide} />
            </mesh>
            {/* Rear door glass */}
            <mesh position={[x, 0.76, -0.52]}>
              <boxGeometry args={[0.032, 0.38, 0.62]} />
              <meshStandardMaterial color="#4e90c0" transparent opacity={0.18} roughness={0.02} side={THREE.DoubleSide} />
            </mesh>
            {/* Quarter glass */}
            <mesh position={[x, 0.73, -1.10]}>
              <boxGeometry args={[0.032, 0.28, 0.24]} />
              <meshStandardMaterial color="#4e90c0" transparent opacity={0.18} roughness={0.02} side={THREE.DoubleSide} />
            </mesh>
            {/* Window surround / seal */}
            <mesh position={[x, 0.78, 0.32]}>
              <boxGeometry args={[0.020, 0.44, 0.78]} />
              <meshStandardMaterial color="#111" roughness={0.7} metalness={0.4} />
            </mesh>
          </group>
        ))}

        {/* ══ TRUNK ══ */}

        <mesh position={[0, 0.202, -1.40]} rotation={[-0.04, 0, 0]} castShadow>
          <boxGeometry args={[1.78, 0.048, 1.25]} />
          <meshStandardMaterial color={color} metalness={0.92} roughness={0.09} envMapIntensity={2.0} />
        </mesh>

        {/* Bootlid spoiler lip */}
        <mesh position={[0, 0.295, -1.98]} castShadow>
          <boxGeometry args={[1.64, 0.050, 0.12]} />
          <meshStandardMaterial color={color} metalness={0.90} roughness={0.11} />
        </mesh>

        {/* ══ HEADLIGHTS ══ */}

        {([-0.595, 0.595] as number[]).map((x, i) => (
          <group key={i} position={[x, 0.14, 2.10]}>
            {/* Outer chrome bezel */}
            <mesh>
              <boxGeometry args={[0.38, 0.138, 0.048]} />
              <meshStandardMaterial color="#aaa" metalness={1.0} roughness={0.05} />
            </mesh>
            {/* Dark inner housing */}
            <mesh position={[0, 0, 0.014]}>
              <boxGeometry args={[0.32, 0.110, 0.036]} />
              <meshStandardMaterial color="#0c0c0c" roughness={0.55} metalness={0.35} />
            </mesh>
            {/* Projector bowl (round) */}
            <mesh position={[0, 0.006, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.040, 0.040, 0.026, 36]} />
              <meshStandardMaterial color="#ddf0ff" metalness={0.12} roughness={0.02} transparent opacity={0.90} />
            </mesh>
            {/* LED matrix */}
            <mesh position={[0, 0.006, 0.034]}>
              <boxGeometry args={[0.20, 0.050, 0.016]} />
              <meshStandardMaterial color="#fff" emissive="#fffbe0" emissiveIntensity={7} />
            </mesh>
            {/* DRL strip */}
            <mesh position={[0, -0.052, 0.030]}>
              <boxGeometry args={[0.32, 0.015, 0.015]} />
              <meshStandardMaterial color="#88ccff" emissive="#66aaff" emissiveIntensity={8} />
            </mesh>
            {/* Amber turn signal */}
            <mesh position={[x > 0 ? 0.12 : -0.12, -0.052, 0.028]}>
              <boxGeometry args={[0.07, 0.015, 0.014]} />
              <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={5} />
            </mesh>
          </group>
        ))}
        <pointLight position={[0.60, 0.20, 2.45]} color="#fff8e0" intensity={3.5} distance={8} />
        <pointLight position={[-0.60, 0.20, 2.45]} color="#fff8e0" intensity={3.5} distance={8} />

        {/* ══ TAIL LIGHTS ══ */}

        {/* Full-width connecting LED bar */}
        <mesh position={[0, 0.26, -2.055]}>
          <boxGeometry args={[1.44, 0.016, 0.022]} />
          <meshStandardMaterial color="#cc1100" emissive="#ff1100" emissiveIntensity={5} />
        </mesh>

        {([-0.575, 0.575] as number[]).map((x, i) => (
          <group key={i} position={[x, 0.26, -2.060]}>
            {/* Cluster housing */}
            <mesh>
              <boxGeometry args={[0.34, 0.118, 0.042]} />
              <meshStandardMaterial color="#7a0000" emissive="#cc0000" emissiveIntensity={2} roughness={0.30} metalness={0.1} />
            </mesh>
            {/* Bright brake LEDs */}
            <mesh position={[0, 0.012, 0.010]}>
              <boxGeometry args={[0.20, 0.068, 0.016]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff1100" emissiveIntensity={7} />
            </mesh>
            {/* Reverse light */}
            <mesh position={[x > 0 ? 0.10 : -0.10, -0.024, 0.010]}>
              <boxGeometry args={[0.095, 0.036, 0.016]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
            </mesh>
          </group>
        ))}
        <pointLight position={[0, 0.28, -2.22]} color="#ff1100" intensity={1.4} distance={4} />

        {/* ══ UNDERCARRIAGE ══ */}

        <mesh position={[0, -0.185, 0]}>
          <boxGeometry args={[1.68, 0.030, 3.80]} />
          <meshStandardMaterial color="#161616" roughness={0.96} />
        </mesh>

        {/* Exhaust pipes × 2 */}
        {([-0.325, 0.325] as number[]).map((x, i) => (
          <group key={i} position={[x, -0.175, -1.98]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.060, 0.20, 28]} />
              <meshStandardMaterial color="#888" metalness={0.96} roughness={0.10} />
            </mesh>
            {/* Chrome tip ring */}
            <mesh position={[0, 0, -0.102]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.055, 0.007, 10, 28]} />
              <meshStandardMaterial color="#ccc" metalness={1.0} roughness={0.04} />
            </mesh>
            {/* Pipe interior */}
            <mesh position={[0, 0, -0.104]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.046, 24]} />
              <meshStandardMaterial color="#000" />
            </mesh>
          </group>
        ))}

        {/* ══ FINE DETAILS ══ */}

        {/* Wiper blades */}
        <mesh position={[0.24, 0.22, 1.88]} rotation={[0, 0, -0.24]}>
          <boxGeometry args={[0.56, 0.010, 0.014]} />
          <meshStandardMaterial color="#111" roughness={0.85} />
        </mesh>
        <mesh position={[-0.14, 0.22, 1.88]} rotation={[0, 0, 0.20]}>
          <boxGeometry args={[0.44, 0.010, 0.014]} />
          <meshStandardMaterial color="#111" roughness={0.85} />
        </mesh>

        {/* Shark-fin antenna */}
        <mesh position={[0, 1.08, -0.36]}>
          <boxGeometry args={[0.038, 0.09, 0.16]} />
          <meshStandardMaterial color={color} metalness={0.85} roughness={0.22} />
        </mesh>

        {/* Wing mirrors */}
        {([-1.0, 1.0] as number[]).map((x, i) => (
          <group key={i} position={[x * 0.955, 0.58, 0.82]}>
            <mesh castShadow>
              <boxGeometry args={[0.068, 0.060, 0.195]} />
              <meshStandardMaterial color={color} metalness={0.88} roughness={0.14} />
            </mesh>
            {/* Mirror glass */}
            <mesh position={[x > 0 ? 0.040 : -0.040, 0, 0]}>
              <boxGeometry args={[0.010, 0.050, 0.140]} />
              <meshStandardMaterial color="#4477aa" metalness={0.96} roughness={0.02} />
            </mesh>
          </group>
        ))}

        {/* Number plates */}
        <mesh position={[0, -0.056, 2.17]}>
          <boxGeometry args={[0.40, 0.092, 0.016]} />
          <meshStandardMaterial color="#f6f6f6" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.065, -2.070]}>
          <boxGeometry args={[0.40, 0.092, 0.016]} />
          <meshStandardMaterial color="#f6f6f6" roughness={0.5} />
        </mesh>

        {/* Fuel filler cap */}
        <mesh position={[0.935, 0.18, -0.98]}>
          <cylinderGeometry args={[0.042, 0.042, 0.016, 20]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Wheel-arch inner liners (dark recesses to mask gap between body & wheel) */}
        {([-0.92, 0.92] as number[]).map((x, i) =>
          [[0, 0, 1.44], [0, 0, -1.48]].map(([, , z], j) => (
            <mesh key={`liner-${i}-${j}`} position={[x, -0.07, z as number]}>
              <boxGeometry args={[0.055, 0.54, 0.74]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.96} />
            </mesh>
          ))
        )}

      </group>

      {/* ─────────────────────────────────────────────
          WHEELS  (world Y=0 = road, wheel centre = TR)
          ───────────────────────────────────────────── */}
      {/* Tyre radius TR = 0.295, so wheel centres at Y = 0.295 */}
      <WheelMount position={[-1.005, 0.295, 1.44]}  flip={true}  />
      <WheelMount position={[ 1.005, 0.295, 1.44]}  flip={false} />
      <WheelMount position={[-1.005, 0.295, -1.48]} flip={true}  />
      <WheelMount position={[ 1.005, 0.295, -1.48]} flip={false} />

    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function LoadingScene() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 bg-white/90 p-6 shadow-[8px_8px_0_#1a1a1a] backdrop-blur-md border-4 border-[#1a1a1a]">
        
        {/* Swiggly / Equalizer Loader */}
        <div className="flex items-center gap-2 h-8">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="w-2.5 bg-[#1a1a1a] shadow-[2px_2px_0_#ffe500]"
              style={{
                height: '100%',
                animation: `squiggly 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.12}s`,
                transformOrigin: 'bottom'
              }}
            />
          ))}
          <style>{`
            @keyframes squiggly {
              0%, 100% { transform: scaleY(0.3); }
              50% { transform: scaleY(1.2); }
            }
          `}</style>
        </div>

        <p className="font-black uppercase tracking-widest text-sm text-[#1a1a1a] mt-2">Rendering Model…</p>
      </div>
    </Html>
  );
}

function StudioFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <MeshReflectorMaterial
        blur={[512, 128]}
        resolution={1024}
        mixBlur={0.85}
        mixStrength={40}
        roughness={0.7}
        depthScale={1.0}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#e4e8eb"
        metalness={0.15}
        mirror={0}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VehicleModelViewer  –  public API unchanged
// ─────────────────────────────────────────────────────────────────────────────
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
        shadows="soft"
        camera={{ position: [5.5, 2.5, 7.5], fov: 36 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.10,
        }}
      >
        <Suspense fallback={<LoadingScene />}>
          <color attach="background" args={['#ffffff']} />
          <fog attach="fog" args={['#ffffff', 20, 42]} />

          {/* Lighting */}
          <ambientLight intensity={0.28} color="#bccce0" />
          <directionalLight
            position={[8, 16, 7]}
            intensity={2.5}
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-far={34}
            shadow-camera-left={-9}
            shadow-camera-right={9}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
            shadow-bias={-0.0003}
            color="#fff9f0"
          />
          <pointLight position={[5, 3, 9]}   intensity={1.1} color="#fff2d8" />
          <pointLight position={[-7, 4, 2]}  intensity={0.9} color="#aaccff" />
          <pointLight position={[-2, 6, -9]} intensity={1.0} color="#ffd070" />
          <pointLight position={[0, -0.5, 0]} intensity={0.2} color="#3355aa" />

          {/* Overhead softbox */}
          <mesh position={[0, 5.8, 0]}>
            <boxGeometry args={[0.07, 0.05, 5.5]} />
            <meshStandardMaterial color="#fff" emissive="#fffbe8" emissiveIntensity={4} />
          </mesh>
          <pointLight position={[0, 5.6, 0]} color="#fff6e0" intensity={7} distance={14} />

          {/* Side softboxes */}
          <mesh position={[-4.8, 2.4, 0]}>
            <boxGeometry args={[0.04, 2.4, 3.8]} />
            <meshStandardMaterial color="#fff" emissive="#d8e8ff" emissiveIntensity={1.6} />
          </mesh>
          <mesh position={[4.8, 2.4, 0]}>
            <boxGeometry args={[0.04, 2.4, 3.8]} />
            <meshStandardMaterial color="#fff" emissive="#fff3dc" emissiveIntensity={1.6} />
          </mesh>

          <Environment preset="studio" />

          <CarMesh color={color} scaleX={scaleX} scaleZ={scaleZ} autoRotate={autoRotate} />

          <StudioFloor />

          <AccumulativeShadows
            position={[0, -0.008, 0]}
            frames={100}
            alphaTest={0.88}
            scale={18}
            opacity={0.5}
            color="#000000"
          >
            <RandomizedLight amount={8} radius={9} intensity={2.0} ambient={0.45} position={[7, 14, 5]} bias={0.001} />
          </AccumulativeShadows>

          <Grid
            position={[0, -0.020, 0]}
            args={[30, 30]}
            cellSize={1}
            cellThickness={0.22}
            cellColor="#eaedf0"
            sectionSize={4}
            sectionThickness={0.65}
            sectionColor="#dbe0e6"
            fadeDistance={16}
            fadeStrength={1.6}
            infiniteGrid
          />

          <Sparkles count={50} scale={10} size={0.4} speed={0.10} opacity={0.055} color="#ffe060" />

          {showControls && (
            <OrbitControls
              makeDefault
              autoRotate={autoRotate}
              autoRotateSpeed={0.80}
              enableZoom
              minDistance={3.5}
              maxDistance={18}
              minPolarAngle={0.08}
              maxPolarAngle={Math.PI / 2.1}
              enableDamping
              dampingFactor={0.05}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Colour chip */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2.5 bg-white backdrop-blur border-4 border-[#1a1a1a] px-3 py-2 shadow-[6px_6px_0_#1a1a1a]">
        <div className="w-6 h-6 border-2 border-[#1a1a1a] shrink-0" style={{ backgroundColor: color }} />
        <span className="font-mono text-sm text-[#1a1a1a] font-black uppercase tracking-wider">{color}</span>
      </div>

      {/* Info cards */}
      {info && info.length > 0 && (
        <div className="absolute top-4 right-4 flex flex-col gap-3">
          {info.map(item => (
            <div key={item.label} className="bg-white backdrop-blur border-4 border-[#1a1a1a] px-5 py-3 text-right shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0_#ffe500] transition-all duration-200 cursor-default">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-xl text-[#1a1a1a] font-black tracking-widest">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur border-2 border-[#1a1a1a] px-2.5 py-1.5 text-[10px] text-[#1a1a1a] font-black uppercase tracking-widest shadow-[4px_4px_0_#1a1a1a]">
        Drag · Rotate · Scroll · Zoom
      </div>
    </div>
  );
}