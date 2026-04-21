import * as THREE from 'three';

type WebGLRendererInit = ConstructorParameters<typeof THREE.WebGLRenderer>[0];

export function createOptimizedRenderer(props: WebGLRendererInit): THREE.WebGLRenderer {
  const init: WebGLRendererInit = {
    ...(props || {}),
    antialias: props?.antialias ?? false,
    alpha: props?.alpha ?? true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    stencil: false,
  };

  const pixelRatio =
    typeof window !== 'undefined'
      ? Math.min(window.devicePixelRatio || 1, 1.25)
      : 1;

  const webglRenderer = new THREE.WebGLRenderer(init);
  webglRenderer.setPixelRatio(pixelRatio);
  webglRenderer.toneMapping = THREE.NoToneMapping;
  if ('outputColorSpace' in webglRenderer) {
    webglRenderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  return webglRenderer;
}
