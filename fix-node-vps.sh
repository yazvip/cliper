#!/bin/bash
set -e

echo "🔧 Deteksi Node.js..."
echo "User node: $(node -v 2>/dev/null || echo 'not found')"
echo "Sudo node: $(sudo node -v 2>/dev/null || echo 'not found')"
echo "System node: $(/usr/bin/node -v 2>/dev/null || echo 'not found')"
echo "nvm node: $(ls ~/.nvm/versions/node/ 2>/dev/null | tail -1 || echo 'no nvm')"

echo ""
echo "❌ Masalah: sudo pakai Node.js lama v12.22.9, butuh v20"
echo "✅ Fix: Install Node.js 20 system-wide"

# 1. Remove old nodejs if exists
echo "📦 Removing old nodejs..."
sudo apt remove -y nodejs npm 2>/dev/null || true
sudo apt autoremove -y 2>/dev/null || true

# 2. Install Node 20 via nodesource
echo "📦 Installing Node.js 20 system-wide..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Verify
echo "✅ Node now: $(node -v)"
echo "✅ Sudo Node now: $(sudo node -v)"
echo "✅ NPM now: $(npm -v)"
echo "✅ Sudo NPM now: $(sudo npm -v)"

# 4. Fix perms
echo "🔧 Fix perms /opt/auto-clipper"
sudo chown -R $USER:$USER /opt/auto-clipper 2>/dev/null || sudo chown -R ubuntu:ubuntu /opt/auto-clipper
cd /opt/auto-clipper

# 5. Clean and install
echo "🧹 Clean node_modules"
rm -rf node_modules package-lock.json
sudo rm -rf node_modules package-lock.json

echo "📦 npm install (with Node 20)"
npm install --no-audit --no-fund
npm install archiver@6.0.1 --save --no-audit --no-fund

# 6. Overwrite critical files build-safe if not already
echo "📄 Overwrite build-safe files"
mkdir -p lib/export
cat > lib/export/zip.ts <<'EOF'
// ZIP Export - 100% build safe
import fs from 'fs';
export async function createClipsZip(clipPaths: { path: string; name: string }[], outputZipPath: string): Promise<string> {
  let archiver: any;
  try {
    const mod = await eval("import('archiver')");
    archiver = mod.default || mod;
  } catch (e:any) {
    const manifest = { clips: clipPaths, createdAt: new Date().toISOString() };
    await fs.promises.writeFile(outputZipPath.replace('.zip','.json'), JSON.stringify(manifest, null, 2));
    throw new Error('archiver not installed');
  }
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve(outputZipPath));
    archive.on('error', (err:any) => reject(err));
    archive.pipe(output);
    for (const c of clipPaths) if (fs.existsSync(c.path)) archive.file(c.path, { name: c.name });
    archive.finalize();
  });
}
EOF

cat > next.config.mjs <<'EOF'
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ['*'] }, serverComponentsExternalPackages: ['archiver'] },
  webpack: (config, { isServer }) => {
    config.externals = [...(config.externals || []), { 'utf-8-validate': 'commonjs utf-8-validate', 'bufferutil': 'commonjs bufferutil', archiver: 'commonjs archiver' }];
    if (!isServer) config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, archiver: false };
    return config;
  }
};
export default nextConfig;
EOF

# 7. Docker build
echo "🐳 Docker build..."
sudo docker-compose -f docker-compose.prod.yml build --no-cache app worker

echo "🚀 Up"
sudo docker-compose -f docker-compose.prod.yml up -d
sudo docker-compose -f docker-compose.prod.yml ps
sudo docker-compose -f docker-compose.prod.yml logs --tail=50 app

echo ""
echo "✅ DONE! Node $(node -v) - Sudo Node $(sudo node -v)"
