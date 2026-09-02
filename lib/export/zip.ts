// ZIP Export - Premium Bulk Download
// Dynamic import to avoid build error if archiver not installed

import fs from 'fs';
import path from 'path';

export async function createClipsZip(clipPaths: { path: string; name: string }[], outputZipPath: string): Promise<string> {
  try {
    // Dynamic import - only loaded at runtime, not during Next.js build
    const archiver = (await import('archiver')).default;
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputZipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(outputZipPath));
      archive.on('error', (err: any) => reject(err));

      archive.pipe(output);

      for (const clip of clipPaths) {
        if (fs.existsSync(clip.path)) {
          archive.file(clip.path, { name: clip.name });
        }
      }

      archive.finalize();
    });
  } catch (e: any) {
    // Fallback if archiver not installed - create JSON manifest instead
    console.warn('archiver not installed, creating manifest:', e.message);
    const manifest = {
      clips: clipPaths,
      note: 'Install archiver: npm i archiver @types/archiver',
      createdAt: new Date().toISOString()
    };
    const manifestPath = outputZipPath.replace('.zip', '.json');
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    // Still throw to let API handle fallback
    throw new Error(`archiver not installed: ${e.message}`);
  }
}
