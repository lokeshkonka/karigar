import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compiler optimizations
  compiler: {
    // Remove console.log statements in production while keeping errors/warnings
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Experimental perf flags
  experimental: {
    // Optimize CSS output
    optimizeCss: true,
    // Optimize package imports (tree-shaking for large libs)
    optimizePackageImports: ['lucide-react', 'recharts', '@react-three/drei'],
  },

  // Compress responses
  compress: true,

  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/icon.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/icon-name.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  // Force all pages to use React Server Components where possible
  reactStrictMode: true,

};

export default nextConfig;
