// ZIP Export - dynamic only, build-safe
import fs from 'fs';

export async function createClipsZip(clipPaths: { path: string; name: string }[], outputZipPath: string): Promise<string> {
  let archiver: any;
  try {
    archiver = (await import('archiver')).default;
  } catch (e:any) {
    console.warn('archiver not found, using fallback');
    // fallback: create simple manifest file
    const manifest = { clips: clipPaths, createdAt: new Date().toISOString() };
    await fs.promises.writeFile(outputZipPath.replace('.zip','.json'), JSON.stringify(manifest, null, 2));
    throw new Error('archiver not installed, run npm i archiver');
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve(outputZipPath));
    archive.on('error', (err:any) => reject(err));
    archive.pipe(output);
    for (const clip of clipPaths) {
      if (fs.existsSync(clip.path)) {
        archive.file(clip.path, { name: clip.name });
      }
    }
    archive.finalize();
  });
}
