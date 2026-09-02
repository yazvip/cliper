/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['*'] },
    serverComponentsExternalPackages: ['archiver', 'bullmq', 'ioredis', '@valkey/valkey-glide']
  },
  typescript: {
    // Allow build to succeed even with type errors for now, we fixed the main one
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    config.externals = [...(config.externals || []), 
      { 'utf-8-validate': 'commonjs utf-8-validate', 'bufferutil': 'commonjs bufferutil' },
      { 'archiver': 'commonjs archiver' },
      { '@valkey/valkey-glide': 'commonjs @valkey/valkey-glide' }
    ];
    if (!isServer) {
      config.resolve.fallback = { 
        ...config.resolve.fallback, 
        fs: false, 
        path: false, 
        archiver: false,
        '@valkey/valkey-glide': false
      };
    }
    // Ignore valkey glide warnings
    config.ignoreWarnings = [
      { module: /valkey-glide/ },
      { message: /valkey-glide/ }
    ];
    return config;
  }
};
export default nextConfig;
