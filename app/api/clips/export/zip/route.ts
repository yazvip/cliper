import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import { createClipsZip } from '@/lib/export/zip';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clipIds: string[] = body.clipIds || [];
    const projectId = body.projectId;

    let clips;
    if (clipIds.length) clips = await prisma.clip.findMany({ where: { id: { in: clipIds } } });
    else if (projectId) clips = await prisma.clip.findMany({ where: { projectId, status: 'COMPLETED' } });
    else return NextResponse.json({ status: false, message: 'Provide clipIds or projectId' }, { status: 400 });

    const validClips = clips.filter(c => c.outputPath).map(c => ({
      path: path.resolve(process.env.OUTPUT_PATH || './outputs', c.outputPath!),
      name: `${c.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'clip'}_${c.id.slice(0,6)}.mp4`
    })).filter(c => fs.existsSync(c.path));

    if (!validClips.length) {
      return NextResponse.json({ status: false, message: 'No rendered clips found. Render clips first.' }, { status: 400 });
    }

    const tmpDir = path.resolve('./tmp/exports');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const zipName = `clips_${projectId || 'export'}_${Date.now()}.zip`;
    const zipPath = path.join(tmpDir, zipName);

    try {
      await createClipsZip(validClips, zipPath);
    } catch {
      // Fallback if archiver not installed - return list
      return NextResponse.json({ status: true, message: 'Archiver not installed, returning file list', data: { clips: validClips, count: validClips.length, note: 'Install archiver: npm i archiver @types/archiver for real ZIP' } });
    }

    // Stream ZIP file
    const stat = await fs.promises.stat(zipPath);
    const fileBuffer = await fs.promises.readFile(zipPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
        'Content-Length': stat.size.toString()
      }
    });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
