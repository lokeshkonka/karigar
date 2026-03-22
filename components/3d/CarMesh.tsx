'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface CarMeshProps {
  color?: string;
  scaleX?: number;
  scaleZ?: number;
  wireframe?: boolean;
  autoRotate?: boolean;
}

// ─── Shared material helpers ────────────────────────────────────────────────

function usePaintMaterial(color: string, wireframe: boolean) {
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.82,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        reflectivity: 1.0,
        envMapIntensity: 2.2,
        wireframe,
      }),
    [color, wireframe]
  );
}

// ─── Wheel ──────────────────────────────────────────────────────────────────
//
// Instead of boxes for spokes, we use proper torus / lathe geometry to get
// smooth, round tyre sidewalls and machined-looking rims.

function Tyre() {
  // Lathe profile for a tyre cross-section: inner rim seat → sidewall bulge → tread
  const profile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    // Build half-profile from wheel centre outward (y = axial, x = radial)
    // Tread plateau
    for (let t = 0; t <= 1; t += 0.25) pts.push(new THREE.Vector2(0.315, (t - 0.5) * 0.24));
    // Tread → sidewall shoulder (large rounded corner)
    const shoulderR = 0.04;
    for (let a = 0; a <= Math.PI / 2; a += Math.PI / 16) {
      pts.push(
        new THREE.Vector2(
          0.315 - shoulderR + shoulderR * Math.cos(a),
          0.12 + shoulderR - shoulderR * Math.sin(a)
        )
      );
    }
    // Sidewall bulge (convex outward for a realistic tyre look)
    for (let a = 0; a <= Math.PI; a += Math.PI / 20) {
      pts.push(
        new THREE.Vector2(
          0.27 + 0.025 * Math.sin(a),
          0.12 - a * (0.2 / Math.PI)
        )
      );
    }
    // Inner rim bead seat
    pts.push(new THREE.Vector2(0.215, -0.08));
    pts.push(new THREE.Vector2(0.208, -0.12));
    return pts;
  }, []);

  const geo = useMemo(() => new THREE.LatheGeometry(profile, 80), [profile]);

  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color="#0d0d0d" roughness={0.94} metalness={0.02} />
    </mesh>
  );
}

function RimSpoke({ angle }: { angle: number }) {
  // Each spoke is a thin BoxGeometry rotated — but we use CylinderGeometry
  // for the rounded cross-section feeling of a machined aluminium spoke.
  const len = 0.175;
  const mid = 0.208 - len / 2 - 0.025;
  return (
    <group rotation={[0, angle, 0]}>
      {/* Outer spoke bar */}
      <mesh position={[mid + len / 2 + 0.025, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.016, len, 14]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.06} metalness={0.98} />
      </mesh>
    </group>
  );
}

function Rim() {
  const spokeAngles = useMemo(
    () => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2),
    []
  );

  return (
    <group>
      {/* Rim barrel */}
      <mesh>
        <cylinderGeometry args={[0.208, 0.208, 0.22, 72]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.07} metalness={0.97} />
      </mesh>

      {/* Rim lip rings (front & rear) */}
      {[0.11, -0.11].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.208, 0.008, 12, 72]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.04} metalness={1.0} />
        </mesh>
      ))}

      {/* Spokes (10 per wheel, fanned) */}
      {spokeAngles.map((a, i) => (
        <RimSpoke key={i} angle={a} />
      ))}

      {/* Centre cap */}
      <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.012, 40]} />
        <meshStandardMaterial color="#505050" roughness={0.45} metalness={0.88} />
      </mesh>

      {/* Brake calliper (visible through spokes) */}
      <mesh position={[0.18, 0, 0]}>
        <boxGeometry args={[0.07, 0.055, 0.11]} />
        <meshStandardMaterial color="#b00e10" roughness={0.35} metalness={0.5} />
      </mesh>

      {/* Brake disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.016, 64]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.55} metalness={0.85} />
      </mesh>
    </group>
  );
}

function Wheel({ position, flip = false }: { position: [number, number, number]; flip?: boolean }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      {/* Tyre rotated to give axial orientation */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <Tyre />
      </group>
      {/* Rim faces outward (+y when rotated); flip flips for the other side */}
      <group scale={[1, flip ? -1 : 1, 1]}>
        <Rim />
      </group>
    </group>
  );
}

// ─── Body panels using ExtrudeGeometry + custom shapes ──────────────────────
//
// The core philosophy: instead of stacking spheres/capsules, we generate
// cross-section profiles and extrude / lathe them.  This gives clean edge
// lines and smooth surfaces — the hallmark of real CG cars.

function useBodyMaterials(color: string, wireframe: boolean) {
  const paint = usePaintMaterial(color, wireframe);

  const darkPaint = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color).multiplyScalar(0.55),
        metalness: 0.65,
        roughness: 0.22,
        clearcoat: 0.5,
        wireframe,
      }),
    [color, wireframe]
  );

  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#6fa8d0',
        transparent: true,
        opacity: 0.22,
        transmission: 0.88,
        ior: 1.52,
        roughness: 0.0,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    []
  );

  const carbon = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#080808', roughness: 0.85, metalness: 0.18 }),
    []
  );

  const chrome = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#e0e0e0', roughness: 0.04, metalness: 1.0 }),
    []
  );

  const rubber = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.96, metalness: 0.0 }),
    []
  );

  return { paint, darkPaint, glass, carbon, chrome, rubber };
}

// ─── Main body: lathe profile for a coupé silhouette ─────────────────────────
//
// We define the upper body profile as a set of 2D points then revolve a partial
// arc — giving us a smooth roof / greenhouse without any visible facets.
// The lower sill / floor is a separate extruded shape.

function BodyShell({ mat }: { mat: THREE.Material }) {
  // Cross-section profile of the body at the car's centre-line (side view):
  // Points go from front bumper nose → bonnet → A-pillar → roof → C-pillar →
  // bootlid → rear bumper, then down to the sill and back.
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // Start at front bumper base
    s.moveTo(2.42, -0.36);
    // Front bumper curve
    s.bezierCurveTo(2.48, -0.36, 2.58, -0.24, 2.58, -0.05);
    // Bonnet rising forward
    s.bezierCurveTo(2.58, 0.18, 2.30, 0.30, 1.85, 0.36);
    // Windscreen base / scuttle
    s.bezierCurveTo(1.60, 0.38, 1.40, 0.40, 1.20, 0.42);
    // A-pillar & roof peak
    s.bezierCurveTo(0.90, 0.86, 0.30, 1.06, 0.0, 1.08);
    // Rear roofline
    s.bezierCurveTo(-0.30, 1.08, -0.80, 1.02, -1.10, 0.88);
    // C-pillar
    s.bezierCurveTo(-1.40, 0.74, -1.60, 0.52, -1.75, 0.38);
    // Bootlid & rear deck
    s.bezierCurveTo(-1.95, 0.32, -2.25, 0.28, -2.42, 0.16);
    // Rear bumper curve
    s.bezierCurveTo(-2.56, 0.04, -2.60, -0.10, -2.58, -0.22);
    // Rear bumper base
    s.bezierCurveTo(-2.55, -0.36, -2.44, -0.42, -2.30, -0.42);
    // Sill bottom — straight
    s.lineTo(2.28, -0.42);
    s.lineTo(2.42, -0.36);
    return s;
  }, []);

  // Extrude sideways to get body width (~1.18 m half-width = full 2.36 m)
  const geo = useMemo(() => {
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: 2.36,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 6,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [shape]);

  // Recentre on X axis (extrude goes from 0..2.36, we want -1.18..+1.18)
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, 0, -1.18);
    m.rotation.set(0, Math.PI / 2, 0);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [geo, mat]);

  return <primitive object={mesh} />;
}

// ─── Roof greenhouse (separate glass + dark pillars) ─────────────────────────

function Greenhouse({ glassMat, pillarMat }: { glassMat: THREE.Material; pillarMat: THREE.Material }) {
  return (
    <group>
      {/* Windscreen */}
      <mesh position={[1.28, 0.72, 0]} rotation={[0, 0, -Math.PI * 0.18]} castShadow>
        <boxGeometry args={[0.68, 0.52, 1.22]} />
        <primitive object={glassMat} attach="material" />
      </mesh>

      {/* Rear screen */}
      <mesh position={[-1.44, 0.68, 0]} rotation={[0, 0, Math.PI * 0.22]} castShadow>
        <boxGeometry args={[0.52, 0.44, 1.14]} />
        <primitive object={glassMat} attach="material" />
      </mesh>

      {/* Side windows (both sides) */}
      {[-1, 1].map((side, i) => (
        <group key={i}>
          {/* Front quarter glass */}
          <mesh position={[0.90, 0.76, side * 0.70]}>
            <boxGeometry args={[0.58, 0.34, 0.03]} />
            <primitive object={glassMat} attach="material" />
          </mesh>
          {/* Rear quarter glass */}
          <mesh position={[-0.62, 0.74, side * 0.70]}>
            <boxGeometry args={[0.54, 0.30, 0.03]} />
            <primitive object={glassMat} attach="material" />
          </mesh>
        </group>
      ))}

      {/* A-pillars */}
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[1.18, 0.60, side * 0.58]} rotation={[0, 0, -Math.PI * 0.18]}>
          <boxGeometry args={[0.56, 0.055, 0.055]} />
          <primitive object={pillarMat} attach="material" />
        </mesh>
      ))}

      {/* B-pillars */}
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[0.18, 0.54, side * 0.62]}>
          <boxGeometry args={[0.05, 0.40, 0.04]} />
          <primitive object={pillarMat} attach="material" />
        </mesh>
      ))}

      {/* C-pillars */}
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[-1.06, 0.62, side * 0.58]} rotation={[0, 0, Math.PI * 0.22]}>
          <boxGeometry args={[0.48, 0.055, 0.055]} />
          <primitive object={pillarMat} attach="material" />
        </mesh>
      ))}

      {/* Roof panel */}
      <mesh position={[0.0, 1.00, 0]}>
        <boxGeometry args={[1.96, 0.06, 1.14]} />
        <primitive object={pillarMat} attach="material" />
      </mesh>
    </group>
  );
}

// ─── Bumpers, sills, diffuser, spoiler ──────────────────────────────────────

function FrontBumper({ paintMat, carbonMat, chromeMat }: { paintMat: THREE.Material; carbonMat: THREE.Material; chromeMat: THREE.Material }) {
  return (
    <group position={[2.45, -0.12, 0]}>
      {/* Main bumper volume */}
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.30, 2.08]} />
        <primitive object={paintMat} attach="material" />
      </mesh>

      {/* Lower splitter */}
      <mesh position={[0.06, -0.18, 0]} castShadow>
        <boxGeometry args={[0.14, 0.045, 1.88]} />
        <primitive object={carbonMat} attach="material" />
      </mesh>

      {/* Horseshoe chrome grille surround */}
      <mesh position={[0.10, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.105, 0.016, 14, 60, Math.PI * 1.12]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>

      {/* Grille mesh (flat dark rectangle) */}
      <mesh position={[0.11, 0.02, 0]}>
        <boxGeometry args={[0.03, 0.18, 0.42]} />
        <meshStandardMaterial color="#040404" roughness={0.9} />
      </mesh>

      {/* Fog light bezels */}
      {[-0.7, 0.7].map((z, i) => (
        <mesh key={i} position={[0.10, -0.10, z]}>
          <cylinderGeometry args={[0.065, 0.065, 0.025, 32]} />
          <primitive object={carbonMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function RearBumper({ paintMat, carbonMat }: { paintMat: THREE.Material; carbonMat: THREE.Material }) {
  return (
    <group position={[-2.46, -0.12, 0]}>
      {/* Main bumper volume */}
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.28, 2.06]} />
        <primitive object={paintMat} attach="material" />
      </mesh>

      {/* Diffuser */}
      <mesh position={[-0.05, -0.18, 0]} castShadow>
        <boxGeometry args={[0.18, 0.05, 1.62]} />
        <primitive object={carbonMat} attach="material" />
      </mesh>

      {/* Diffuser fins */}
      {[-0.54, -0.18, 0.18, 0.54].map((z, i) => (
        <mesh key={i} position={[-0.04, -0.12, z]}>
          <boxGeometry args={[0.16, 0.10, 0.012]} />
          <primitive object={carbonMat} attach="material" />
        </mesh>
      ))}

      {/* Quad exhaust pipes */}
      {[-0.48, -0.20, 0.20, 0.48].map((z, i) => (
        <group key={i} position={[-0.06, -0.16, z]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.038, 0.042, 0.12, 24]} />
            <meshStandardMaterial color="#888" roughness={0.10} metalness={0.96} />
          </mesh>
          <mesh position={[-0.062, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.038, 0.005, 8, 24]} />
            <meshStandardMaterial color="#d4d4d4" roughness={0.05} metalness={1.0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Sills({ paintMat }: { paintMat: THREE.Material }) {
  return (
    <>
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[0, -0.38, side * 1.08]} castShadow>
          <boxGeometry args={[4.22, 0.09, 0.12]} />
          <primitive object={paintMat} attach="material" />
        </mesh>
      ))}
    </>
  );
}

function RearSpoilerLip({ paintMat }: { paintMat: THREE.Material }) {
  return (
    <group position={[-2.02, 0.36, 0]}>
      {/* Blade */}
      <mesh castShadow>
        <boxGeometry args={[0.055, 0.055, 1.78]} />
        <primitive object={paintMat} attach="material" />
      </mesh>
      {/* End plates */}
      {[-0.89, 0.89].map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <boxGeometry args={[0.055, 0.10, 0.055]} />
          <primitive object={paintMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Lights ──────────────────────────────────────────────────────────────────

function HeadlightAssembly() {
  return (
    <>
      {[-0.62, 0.62].map((z, i) => (
        <group key={i} position={[2.22, 0.18, z]}>
          {/* DRL light bar */}
          <mesh>
            <capsuleGeometry args={[0.016, 0.28, 6, 16]} />
            <meshStandardMaterial
              color="#f8fcff"
              emissive="#cde5ff"
              emissiveIntensity={7.5}
            />
          </mesh>
          {/* Lower DRL strip */}
          <mesh position={[0.02, -0.055, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.010, 0.22, 6, 14]} />
            <meshStandardMaterial
              color="#eef5ff"
              emissive="#b4d0ff"
              emissiveIntensity={5.5}
            />
          </mesh>
          {/* Main projector bowl */}
          <mesh position={[0.04, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.055, 0.065, 0.025, 32]} />
            <meshStandardMaterial color="#c8c8c8" roughness={0.08} metalness={0.95} />
          </mesh>
        </group>
      ))}
      <pointLight position={[2.5, 0.22, 0.65]} color="#fff9e8" intensity={4.0} distance={9} />
      <pointLight position={[2.5, 0.22, -0.65]} color="#fff9e8" intensity={4.0} distance={9} />
    </>
  );
}

function TailLightAssembly() {
  return (
    <>
      {/* Full-width light ribbon */}
      <mesh position={[-2.35, 0.25, 0]}>
        <capsuleGeometry args={[0.018, 1.52, 6, 22]} />
        <meshStandardMaterial
          color="#ff1100"
          emissive="#ff2200"
          emissiveIntensity={6.0}
        />
      </mesh>
      {/* Vertical accent lines */}
      {[-0.65, 0.65].map((z, i) => (
        <mesh key={i} position={[-2.32, 0.22, z]}>
          <capsuleGeometry args={[0.012, 0.18, 4, 14]} />
          <meshStandardMaterial
            color="#ff0800"
            emissive="#ff1400"
            emissiveIntensity={5.0}
          />
        </mesh>
      ))}
      <pointLight position={[-2.45, 0.26, 0]} color="#ff1200" intensity={1.5} distance={5} />
    </>
  );
}

// ─── Mirrors ─────────────────────────────────────────────────────────────────

function Mirrors({ paintMat }: { paintMat: THREE.Material }) {
  return (
    <>
      {[-1, 1].map((side, i) => (
        <group key={i} position={[1.10, 0.56, side * 0.80]}>
          {/* Mirror housing (aerodynamic pod) */}
          <mesh scale={[1.2, 0.6, 0.9]} castShadow>
            <sphereGeometry args={[0.075, 18, 14]} />
            <primitive object={paintMat} attach="material" />
          </mesh>
          {/* Mirror glass */}
          <mesh position={[side > 0 ? 0.045 : -0.045, 0, 0]}>
            <boxGeometry args={[0.008, 0.052, 0.105]} />
            <meshStandardMaterial
              color="#4a80b8"
              roughness={0.02}
              metalness={0.94}
              envMapIntensity={2.0}
            />
          </mesh>
          {/* Stalk */}
          <mesh position={[-side * 0.06, -0.04, -0.02]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.010, 0.014, 0.11, 10]} />
            <primitive object={paintMat} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── Floor / underbody ───────────────────────────────────────────────────────

function Underbody({ carbonMat }: { carbonMat: THREE.Material }) {
  return (
    <mesh position={[0, -0.40, 0]} castShadow receiveShadow>
      <boxGeometry args={[4.56, 0.045, 1.90]} />
      <primitive object={carbonMat} attach="material" />
    </mesh>
  );
}

// ─── Number plates ───────────────────────────────────────────────────────────

function NumberPlates() {
  return (
    <>
      {/* Front */}
      <mesh position={[2.52, -0.12, 0]}>
        <boxGeometry args={[0.012, 0.09, 0.44]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.5} />
      </mesh>
      {/* Rear */}
      <mesh position={[-2.52, -0.10, 0]}>
        <boxGeometry args={[0.012, 0.09, 0.44]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.5} />
      </mesh>
    </>
  );
}

// ─── Root component ──────────────────────────────────────────────────────────

export function CarMesh({
  color = '#1a3a5c',
  scaleX = 1,
  scaleZ = 1,
  wireframe = false,
  autoRotate = true,
}: CarMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.18;
    }
  });

  const { paint, darkPaint, glass, carbon, chrome } = useBodyMaterials(color, wireframe);

  // Wheel positions: [x = lateral, y = vertical, z = longitudinal]
  const wheelX = 0.96;
  const wheelY = 0.315;
  const fZ = 1.42;
  const rZ = -1.38;

  return (
    <group ref={groupRef} scale={[scaleX, 1, scaleZ]}>
      {/* Lift the whole car so wheels sit on y=0 */}
      <group position={[0, wheelY + 0.065, 0]}>

        {/* ── Body ── */}
        <BodyShell mat={paint} />
        <Greenhouse glassMat={glass} pillarMat={darkPaint} />

        {/* ── Appendages ── */}
        <FrontBumper paintMat={paint} carbonMat={carbon} chromeMat={chrome} />
        <RearBumper paintMat={paint} carbonMat={carbon} />
        <Sills paintMat={paint} />
        <RearSpoilerLip paintMat={darkPaint} />
        <Mirrors paintMat={paint} />
        <Underbody carbonMat={carbon} />
        <NumberPlates />

        {/* ── Lights ── */}
        <HeadlightAssembly />
        <TailLightAssembly />
      </group>

      {/* ── Wheels (at ground level) ── */}
      <Wheel position={[-wheelX, wheelY, fZ]} flip />
      <Wheel position={[ wheelX, wheelY, fZ]} />
      <Wheel position={[-wheelX, wheelY, rZ]} flip />
      <Wheel position={[ wheelX, wheelY, rZ]} />
    </group>
  );
}