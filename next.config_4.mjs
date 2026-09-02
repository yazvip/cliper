/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix fonts.gstatic.com failure during build
  optimizeFonts: false,
  
  experimental: {
    serverActions: { allowedOrigins: ['*'] },
    serverComponentsExternalPackages: ['archiver', 'bullmq', 'ioredis', '@prisma/client'],
  },
  
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // Skip static generation for API routes
  async headers() {
    return [];
  },
  
  webpack: (config, { isServer }) => {
    config.externals = [
      ...(config.externals || []),
      { 'utf-8-validate': 'commonjs utf-8-validate' },
      { 'bufferutil': 'commonjs bufferutil' },
      { 'archiver': 'commonjs archiver' },
      { '@valkey/valkey-glide': 'commonjs @valkey/valkey-glide' },
      { '@prisma/client': 'commonjs @prisma/client' },
    ];
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        archiver: false,
        '@valkey/valkey-glide': false,
      };
    }
    
    // Ignore warnings
    config.ignoreWarnings = [
      { module: /valkey-glide/ },
      { message: /valkey-glide/ },
      { message: /fonts\.gstatic/ },
    ];
    
    return config;
  },
};

export default nextConfig;
