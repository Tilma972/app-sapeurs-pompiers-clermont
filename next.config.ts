import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'npyfregghvnmqxwgkfea.supabase.co',
      'images.unsplash.com',
    ],
    qualities: [25, 50, 75, 90, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'npyfregghvnmqxwgkfea.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
