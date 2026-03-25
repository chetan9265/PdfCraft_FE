import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // @ts-ignore - canvas is not a type
      config.resolve.alias.canvas = false;
    }
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      crypto: false,
      canvas: false,
      encoding: false,
    };
    
    return config;
  },
  transpilePackages: ['pdfjs-dist'],
};

export default nextConfig;