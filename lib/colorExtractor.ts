/**
 * Advanced k-means Color Extractor
 * Runs on a canvas element to extract the most dominant car body paint color,
 * intelligently filtering out sky (white/light-gray), asphalt (dark-gray/black),
 * and over/under-exposed pixels.
 */

export interface RGBColor { r: number; g: number; b: number }

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function isBackground(r: number, g: number, b: number): boolean {
  const [, s, l] = rgbToHsl(r, g, b);
  // Filter out: near-white (sky, walls), near-black (road, shadows), near-gray (road)
  if (l > 88) return true; // too bright → sky/white body
  if (l < 8) return true;  // too dark → shadow
  if (s < 8 && l > 20 && l < 75) return true; // desaturated gray → road/wall
  return false;
}

function colorDistance(a: RGBColor, b: RGBColor): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 +
    (a.g - b.g) ** 2 +
    (a.b - b.b) ** 2
  );
}

function kMeansIterate(pixels: RGBColor[], centroids: RGBColor[], iterations = 8): RGBColor[] {
  let current = centroids;

  for (let iter = 0; iter < iterations; iter++) {
    // Assign each pixel to nearest centroid
    const clusters: RGBColor[][] = current.map(() => []);
    for (const px of pixels) {
      let minDist = Infinity, minIdx = 0;
      for (let i = 0; i < current.length; i++) {
        const d = colorDistance(px, current[i]);
        if (d < minDist) { minDist = d; minIdx = i; }
      }
      clusters[minIdx].push(px);
    }
    // Recompute centroids
    current = clusters.map((cluster, i) => {
      if (cluster.length === 0) return current[i];
      const r = Math.round(cluster.reduce((s, c) => s + c.r, 0) / cluster.length);
      const g = Math.round(cluster.reduce((s, c) => s + c.g, 0) / cluster.length);
      const b = Math.round(cluster.reduce((s, c) => s + c.b, 0) / cluster.length);
      return { r, g, b };
    });
  }

  return current;
}

export function extractDominantColor(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#888888';

  const { width, height } = canvas;
  // Sample only the center-ish region (avoid edges which are background)
  const margin = Math.min(width, height) * 0.15;
  const imageData = ctx.getImageData(margin, margin, width - margin * 2, height - margin * 2);
  const data = imageData.data;

  // Collect filtered pixels (sample every 6th pixel for performance)
  const pixels: RGBColor[] = [];
  for (let i = 0; i < data.length; i += 24) { // step 6 pixels (6 * 4 bytes)
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (!isBackground(r, g, b)) {
      pixels.push({ r, g, b });
    }
  }

  if (pixels.length < 50) {
    // Fallback: just average everything
    let r = 0, g = 0, b = 0;
    for (const px of pixels) { r += px.r; g += px.g; b += px.b; }
    const n = pixels.length || 1;
    return toHex(Math.round(r / n), Math.round(g / n), Math.round(b / n));
  }

  // Initialize centroids with k=5 spread picks
  const k = 5;
  const step = Math.floor(pixels.length / k);
  const centroids: RGBColor[] = Array.from({ length: k }, (_, i) => pixels[i * step]);

  const finalCentroids = kMeansIterate(pixels, centroids, 12);

  // Find the largest cluster
  const clusterSizes = finalCentroids.map(centroid => {
    return pixels.filter(px => {
      const d = colorDistance(px, centroid);
      return finalCentroids.every(c => colorDistance(px, centroid) <= colorDistance(px, c));
    }).length;
  });

  const dominantIdx = clusterSizes.indexOf(Math.max(...clusterSizes));
  const { r, g, b } = finalCentroids[dominantIdx];
  return toHex(r, g, b);
}

function toHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Estimate aspect ratio from the top-down image to scale the car mesh.
 * Returns [widthRatio, lengthRatio] normalized to 1.0
 */
export function estimateCarDimensions(canvas: HTMLCanvasElement): { scaleX: number; scaleZ: number } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { scaleX: 1, scaleZ: 1 };

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Get the dominant color to use as reference
  const color = extractDominantColor(canvas);
  const hr = parseInt(color.slice(1, 3), 16);
  const hg = parseInt(color.slice(3, 5), 16);
  const hb = parseInt(color.slice(5, 7), 16);

  // Find car bounding box: pixels close in color to dominant
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const dr = Math.abs(data[i] - hr);
      const dg = Math.abs(data[i + 1] - hg);
      const db = Math.abs(data[i + 2] - hb);
      if (dr + dg + db < 80) { // within color threshold
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const carWidth = maxX - minX;
  const carLength = maxY - minY;
  if (carWidth === 0 || carLength === 0) return { scaleX: 1, scaleZ: 1 };

  const aspect = carWidth / carLength;
  // Standard car ratio is ~0.45 (1.8m wide / 4m long)
  // Scale the mesh accordingly
  const scaleX = Math.max(0.8, Math.min(1.3, aspect / 0.45));
  const scaleZ = 1.0;

  return { scaleX, scaleZ };
}
