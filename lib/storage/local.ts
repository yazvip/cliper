import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

export interface StorageProvider {
  save(file: Buffer, originalName: string, subdir: string): Promise<{ path: string; filename: string }>;
  getAbsolutePath(relativePath: string): string;
  delete(relativePath: string): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  basePath: string;
  constructor(basePath = process.env.STORAGE_PATH || './uploads') { this.basePath = basePath; }

  async save(file: Buffer, originalName: string, subdir: string) {
    const ext = path.extname(originalName);
    const filename = `${nanoid()}_${Date.now()}${ext}`;
    const dir = path.join(this.basePath, subdir);
    await fs.mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, filename);
    await fs.writeFile(fullPath, file);
    return { path: path.join(subdir, filename), filename };
  }

  getAbsolutePath(relativePath: string) { return path.resolve(path.join(this.basePath, relativePath)); }
  async delete(relativePath: string) { try { await fs.unlink(this.getAbsolutePath(relativePath)); } catch {} }
  async exists(relativePath: string) { try { await fs.access(this.getAbsolutePath(relativePath)); return true; } catch { return false; } }
}

export const storage = new LocalStorageProvider();
export const outputStorage = new LocalStorageProvider(process.env.OUTPUT_PATH || './outputs');
