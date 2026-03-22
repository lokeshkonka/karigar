import * as THREE from 'three';

type WebGLRendererInit = ConstructorParameters<typeof THREE.WebGLRenderer>[0];

export async function createOptimizedRenderer(
  props: WebGLRendererInit
): Promise<THREE.WebGLRenderer> {
  const init = {
    ...(props || {}),
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  } as WebGLRendererInit;

  const pixelRatio =
    typeof window !== 'undefined'
      ? Math.min(window.devicePixelRatio || 1, 1.25)
      : 1;

  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      const webgpuModule = await import('three/webgpu');
      const webgpuRenderer = new webgpuModule.WebGPURenderer(
        init as unknown as ConstructorParameters<
          typeof webgpuModule.WebGPURenderer
        >[0]
      );

      const maybeInit = webgpuRenderer as unknown as { init?: () => Promise<void> };
      if (typeof maybeInit.init === 'function') {
        await maybeInit.init();
      }

      (webgpuRenderer as unknown as { setPixelRatio: (value: number) => void }).setPixelRatio(pixelRatio);
      (webgpuRenderer as unknown as { toneMapping: THREE.ToneMapping }).toneMapping = THREE.NoToneMapping;

      return webgpuRenderer as unknown as THREE.WebGLRenderer;
    } catch {
      // Falls back to WebGL below.
    }
  }

  const webglRenderer = new THREE.WebGLRenderer(init);
  webglRenderer.setPixelRatio(pixelRatio);
  webglRenderer.toneMapping = THREE.NoToneMapping;
  return webglRenderer;
}
