/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ['*'] } },
  webpack: (config, { isServer }) => {
    config.externals.push({ 'utf-8-validate': 'commonjs utf-8-validate', 'bufferutil': 'commonjs bufferutil' });
    // Don't bundle archiver on client, keep it server-only
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    }
    return config;
  }
};
export default nextConfig;
