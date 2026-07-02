import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow Firebase Storage images
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      // Allow placeholder services in development
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
