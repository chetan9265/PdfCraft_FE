const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
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