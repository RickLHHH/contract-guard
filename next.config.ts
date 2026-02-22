import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure images
  images: {
    unoptimized: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
