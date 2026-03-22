'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';

export interface CarMeshProps {
  color?: string;
  scaleX?: number;
  scaleZ?: number;
  wireframe?: boolean;
  autoRotate?: boolean;
}

const CAMARO_MODEL_URL = '/models/chevrolet-camaro.fbx';

function buildMaterial(
  source: THREE.Material,
  meshName: string,
  bodyColor: THREE.Color,
  wireframe: boolean
) {
  const name = `${source.name || ''} ${meshName}`.toLowerCase();

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8a8a8a'),
    roughness: 0.45,
    metalness: 0.2,
    wireframe,
  });

  const isGlass = name.includes('glass') || name.includes('window') || name.includes('wind');
  const isTyre = name.includes('tyre') || name.includes('tire') || name.includes('rubber');
  const isWheel = name.includes('wheel') || name.includes('rim') || name.includes('hub') || name.includes('spoke');
  const isLight = name.includes('light') || name.includes('lamp') || name.includes('head') || name.includes('tail');
  const isTrim =
    name.includes('bumper') ||
    name.includes('grill') ||
    name.includes('grille') ||
    name.includes('diffuser') ||
    name.includes('exhaust') ||
    name.includes('interior') ||
    name.includes('seat') ||
    name.includes('chassis') ||
    name.includes('black');

  if (isGlass) {
    mat.color = new THREE.Color('#121922');
    mat.transparent = true;
    mat.opacity = 0.34;
    mat.roughness = 0.05;
    mat.metalness = 0.05;
    return mat;
  }

  if (isTyre) {
    mat.color = new THREE.Color('#101010');
    mat.roughness = 0.95;
    mat.metalness = 0.02;
    return mat;
  }

  if (isWheel) {
    mat.color = new THREE.Color('#c3c7cd');
    mat.roughness = 0.2;
    mat.metalness = 0.88;
    return mat;
  }

  if (isLight) {
    mat.color = new THREE.Color('#f2f5f8');
    mat.emissive = new THREE.Color('#f2f5f8');
    mat.emissiveIntensity = 0.22;
    mat.roughness = 0.12;
    mat.metalness = 0.06;
    return mat;
  }

  if (isTrim) {
    mat.color = new THREE.Color('#141414');
    mat.roughness = 0.82;
    mat.metalness = 0.14;
    return mat;
  }

  // Any unknown mesh defaults to body paint so color change always works.
  mat.color = bodyColor.clone();
  mat.roughness = 0.2;
  mat.metalness = 0.82;
  return mat;
}

export function CarMesh({
  color = '#7f8791',
  scaleX = 1,
  scaleZ = 1,
  wireframe = false,
  autoRotate = true,
}: CarMeshProps) {
  const rootRef = useRef<THREE.Group>(null);
  const rawModel = useFBX(CAMARO_MODEL_URL);

  const prepared = useMemo(() => {
    const bodyColor = new THREE.Color(color);
    const cloned = rawModel.clone(true);

    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;

      obj.castShadow = true;
      obj.receiveShadow = true;

      if (obj.geometry) {
        obj.geometry.computeVertexNormals();
      }

      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map((m) => buildMaterial(m, obj.name || '', bodyColor, wireframe));
      } else if (obj.material) {
        obj.material = buildMaterial(obj.material, obj.name || '', bodyColor, wireframe);
      }
    });

    return cloned;
  }, [rawModel, color, wireframe]);

  const normalized = useMemo(() => {
    const box = new THREE.Box3().setFromObject(prepared);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const lengthAxisIsX = size.x > size.z;
    const rotationY = lengthAxisIsX ? Math.PI / 2 : 0;
    const modelLength = lengthAxisIsX ? size.x : size.z;
    const targetLength = 4.65;
    const uniformScale = modelLength > 0 ? targetLength / modelLength : 1;

    return {
      rotationY,
      position: new THREE.Vector3(-center.x, -box.min.y, -center.z),
      uniformScale,
    };
  }, [prepared]);

  useFrame((_, delta) => {
    if (!rootRef.current || !autoRotate) return;
    rootRef.current.rotation.y += delta * 0.24;
  });

  return (
    <group ref={rootRef} scale={[scaleX, 1, scaleZ]}>
      <group rotation={[0, normalized.rotationY, 0]}>
        <primitive
          object={prepared}
          position={[normalized.position.x, normalized.position.y, normalized.position.z]}
          scale={normalized.uniformScale}
        />
      </group>
    </group>
  );
}

useFBX.preload(CAMARO_MODEL_URL);
