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

  // Force all pages to use React Server Components where possible
  reactStrictMode: true,

  // Webpack tweaks for Three.js
  webpack: (config, { isServer }) => {
    // Prevent Three.js from being bundled on the server
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
        'three',
        '@react-three/fiber',
        '@react-three/drei',
      ];
    }
    return config;
  },
};

export default nextConfig;
