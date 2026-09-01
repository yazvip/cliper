import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

export async function createClipsZip(clipPaths: { path: string; name: string }[], outputZipPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(outputZipPath));
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    for (const clip of clipPaths) {
      if (fs.existsSync(clip.path)) {
        archive.file(clip.path, { name: clip.name });
      }
    }

    archive.finalize();
  });
}

// Fallback without archiver - simple concatenation list for demo
export async function createClipsZipSimple(clipPaths: { path: string; name: string }[], outputZipPath: string) {
  // If archiver not available, create a text file listing paths (demo mode)
  const content = clipPaths.map(c => `${c.name}: ${c.path}`).join('\n');
  await fs.promises.writeFile(outputZipPath.replace('.zip', '.txt'), content);
  return outputZipPath;
}
