const nextConfig = {
  turbopack: {},

  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"], // 🔥 THIS LINE FIXES EVERYTHING
  },

  webpack: (config: any) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;