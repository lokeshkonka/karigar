'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export interface CarMeshProps {
  color?: string;
  scaleX?: number;
  scaleZ?: number;
  wireframe?: boolean;
  autoRotate?: boolean;
}

const CAMARO_MODEL_URL = '/models/chevrolet-camaro.fbx';

let modelCache: THREE.Group | null = null;
let modelLoadPromise: Promise<THREE.Group> | null = null;

function safeColor(input: string, fallback = '#7f8791') {
  try {
    return new THREE.Color(input);
  } catch {
    return new THREE.Color(fallback);
  }
}

function loadCamaroModel() {
  if (modelCache) return Promise.resolve(modelCache);
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = new Promise<THREE.Group>((resolve, reject) => {
    const loader = new FBXLoader();
    loader.load(
      CAMARO_MODEL_URL,
      (group) => {
        modelCache = group;
        resolve(group);
      },
      undefined,
      (err) => reject(err)
    );
  });

  return modelLoadPromise;
}

function buildMaterial(source: THREE.Material, meshName: string, bodyColor: THREE.Color, wireframe: boolean) {
  const key = `${source.name || ''} ${meshName}`.toLowerCase();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8a8a8a'),
    roughness: 0.45,
    metalness: 0.2,
    wireframe,
  });

  if (key.includes('glass') || key.includes('window') || key.includes('wind')) {
    mat.color = new THREE.Color('#121922');
    mat.transparent = true;
    mat.opacity = 0.34;
    mat.roughness = 0.06;
    mat.metalness = 0.05;
    return mat;
  }

  if (key.includes('tyre') || key.includes('tire') || key.includes('rubber')) {
    mat.color = new THREE.Color('#101010');
    mat.roughness = 0.95;
    mat.metalness = 0.02;
    return mat;
  }

  if (key.includes('wheel') || key.includes('rim') || key.includes('hub') || key.includes('spoke')) {
    mat.color = new THREE.Color('#c3c7cd');
    mat.roughness = 0.22;
    mat.metalness = 0.88;
    return mat;
  }

  if (key.includes('light') || key.includes('lamp') || key.includes('head') || key.includes('tail')) {
    mat.color = new THREE.Color('#f2f5f8');
    mat.emissive = new THREE.Color('#f2f5f8');
    mat.emissiveIntensity = 0.2;
    mat.roughness = 0.12;
    mat.metalness = 0.05;
    return mat;
  }

  if (
    key.includes('bumper') ||
    key.includes('grill') ||
    key.includes('grille') ||
    key.includes('diffuser') ||
    key.includes('exhaust') ||
    key.includes('interior') ||
    key.includes('seat') ||
    key.includes('chassis') ||
    key.includes('black')
  ) {
    mat.color = new THREE.Color('#141414');
    mat.roughness = 0.82;
    mat.metalness = 0.14;
    return mat;
  }

  // Default anything else to body paint so color updates are always visible.
  mat.color = bodyColor.clone();
  mat.roughness = 0.2;
  mat.metalness = 0.82;
  return mat;
}

function FallbackCar({ color, wireframe }: { color: string; wireframe: boolean }) {
  return (
    <group position={[0, 0.2, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.9, 0.75, 4.3]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.24} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[2, 0.12, 4.4]} />
        <meshStandardMaterial color="#141414" roughness={0.84} />
      </mesh>
    </group>
  );
}

export function CarMesh({
  color = '#7f8791',
  scaleX = 1,
  scaleZ = 1,
  wireframe = false,
  autoRotate = true,
}: CarMeshProps) {
  const rootRef = useRef<THREE.Group>(null);
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCamaroModel()
      .then((model) => {
        if (cancelled) return;
        setLoadedModel(model.clone(true));
      })
      .catch(() => {
        if (cancelled) return;
        setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const prepared = useMemo(() => {
    if (!loadedModel) return null;
    const bodyColor = safeColor(color);
    const cloned = loadedModel.clone(true);

    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;

      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map((m) => buildMaterial(m, obj.name || '', bodyColor, wireframe));
      } else if (obj.material) {
        obj.material = buildMaterial(obj.material, obj.name || '', bodyColor, wireframe);
      }
    });

    return cloned;
  }, [loadedModel, color, wireframe]);

  const normalized = useMemo(() => {
    if (!prepared) {
      return {
        rotationY: 0,
        position: new THREE.Vector3(0, 0, 0),
        uniformScale: 1,
      };
    }

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
    if (rootRef.current && autoRotate) {
      rootRef.current.rotation.y += delta * 0.24;
    }
  });

  return (
    <group ref={rootRef} scale={[scaleX, 1, scaleZ]}>
      {prepared && !loadFailed ? (
        <group rotation={[0, normalized.rotationY, 0]}>
          <primitive
            object={prepared}
            position={[normalized.position.x, normalized.position.y, normalized.position.z]}
            scale={normalized.uniformScale}
          />
        </group>
      ) : (
        <FallbackCar color={safeColor(color).getStyle()} wireframe={wireframe} />
      )}
    </group>
  );
}
