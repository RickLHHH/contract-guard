import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for deployment
  output: 'standalone',
  
  // Configure images
  images: {
    unoptimized: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
