import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { clipIds } = await req.json();
    if (!clipIds || !clipIds.length) return NextResponse.json({ error: 'No clipIds' }, { status: 400 });

    const clips = await prisma.clip.findMany({
      where: { id: { in: clipIds }, project: { userId: (user as any).id } }
    });

    const valid = clips.filter(c => c.outputPath);
    if (!valid.length) return NextResponse.json({ error: 'No rendered clips' }, { status: 400 });

    const fs = await import('fs');
    const path = await import('path');
    const outputDir = process.env.OUTPUT_PATH || './outputs';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const zipName = `clips-${Date.now()}.zip`;
    const zipPath = path.join(outputDir, zipName);

    const { createClipsZip } = await import('@/lib/export/zip');

    const clipPaths = valid.map(c => ({
      path: c.outputPath!,
      name: `${c.title || c.id}.mp4`
    }));

    try {
      await createClipsZip(clipPaths, zipPath);
    } catch (e:any) {
      return NextResponse.json({ warning: 'zip fallback', files: clipPaths, error: e.message });
    }

    return NextResponse.json({ zipPath: zipName, count: valid.length });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
