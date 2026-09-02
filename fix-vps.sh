#!/bin/bash
set -e
cd /opt/auto-clipper

echo "🔧 Fix 1: Permission - chown folder"
sudo chown -R ubuntu:ubuntu /opt/auto-clipper 2>/dev/null || sudo chown -R $USER:$USER /opt/auto-clipper
sudo chmod -R 755 /opt/auto-clipper

echo "🔧 Fix 2: Overwrite lib/export/zip.ts build-safe (NO archiver import at top)"
mkdir -p lib/export
cat > lib/export/zip.ts <<'EOF'
// ZIP Export - 100% build safe, no archiver at build time
import fs from 'fs';
export async function createClipsZip(clipPaths: { path: string; name: string }[], outputZipPath: string): Promise<string> {
  // Lazy load archiver only at runtime
  let archiver: any;
  try {
    // @ts-ignore
    const mod = await eval("import('archiver')");
    archiver = mod.default || mod;
  } catch (e:any) {
    console.warn('archiver not found, fallback to manifest');
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
    for (const clip of clipPaths) {
      if (fs.existsSync(clip.path)) archive.file(clip.path, { name: clip.name });
    }
    archive.finalize();
  });
}
EOF

echo "🔧 Fix 3: Overwrite route to dynamic import"
mkdir -p app/api/clips/export/zip
cat > app/api/clips/export/zip/route.ts <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { clipIds } = await req.json();
    if (!clipIds?.length) return NextResponse.json({ error: 'No clipIds' }, { status: 400 });
    const clips = await prisma.clip.findMany({ where: { id: { in: clipIds }, project: { userId: user.id } } });
    const valid = clips.filter(c => c.outputPath);
    if (!valid.length) return NextResponse.json({ error: 'No rendered clips' }, { status: 400 });
    const fs = await import('fs');
    const path = await import('path');
    const outputDir = process.env.OUTPUT_PATH || './outputs';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const zipName = `clips-${Date.now()}.zip`;
    const zipPath = path.join(outputDir, zipName);
    const clipPaths = valid.map(c => ({ path: c.outputPath!, name: `${c.title || c.id}.mp4` }));
    // Lazy load
    try {
      const { createClipsZip } = await import('@/lib/export/zip');
      await createClipsZip(clipPaths, zipPath);
    } catch (e:any) {
      return NextResponse.json({ warning: 'archiver missing', files: clipPaths, fallback: true, error: e.message });
    }
    return NextResponse.json({ zipPath: zipName, count: valid.length });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
EOF

echo "🔧 Fix 4: Overwrite next.config.mjs to ignore archiver"
cat > next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['*'] },
    serverComponentsExternalPackages: ['archiver', 'archiver-zip-encrypted']
  },
  webpack: (config, { isServer }) => {
    config.externals = [...(config.externals || []), { 'utf-8-validate': 'commonjs utf-8-validate', 'bufferutil': 'commonjs bufferutil', archiver: 'commonjs archiver' }];
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, archiver: false };
    }
    return config;
  }
};
export default nextConfig;
EOF

echo "🔧 Fix 5: Ensure package.json has archiver"
if ! grep -q '"archiver"' package.json; then
  echo "Adding archiver to package.json..."
  # Add archiver via jq or manual edit
  node -e "
    const fs=require('fs');
    const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
    pkg.dependencies= pkg.dependencies||{};
    pkg.dependencies.archiver='^6.0.1';
    pkg.devDependencies= pkg.devDependencies||{};
    pkg.devDependencies['@types/archiver']='^6.0.2';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('archiver added');
  "
fi

echo "🔧 Fix 6: Clean npm and install with correct perms"
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install --no-audit --no-fund
npm install archiver@6.0.1 --save --no-audit --no-fund

echo "🔧 Fix 7: Fix Dockerfile to fallback"
cat > Dockerfile <<'EOF'
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund || npm install --no-audit --no-fund; else npm install --no-audit --no-fund; fi
COPY . .
RUN npx prisma generate 2>/dev/null || echo "prisma generate skipped"
RUN npm run build
EXPOSE 3000
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
EOF

cat > Dockerfile.worker <<'EOF'
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ffmpeg
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund || npm install --no-audit --no-fund; else npm install --no-audit --no-fund; fi
COPY . .
RUN npx prisma generate 2>/dev/null || echo "prisma generate skipped"
CMD ["npm", "run", "worker"]
EOF

echo "🔧 Fix 8: Build"
sudo docker-compose -f docker-compose.prod.yml build --no-cache app worker

echo "🔧 Fix 9: Up"
sudo docker-compose -f docker-compose.prod.yml up -d

echo "✅ Done! Checking..."
sudo docker-compose -f docker-compose.prod.yml ps
sudo docker-compose -f docker-compose.prod.yml logs --tail=30 app
