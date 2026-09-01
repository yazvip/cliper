import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { videoQueue } from '@/lib/queue';
import { generateAssFile } from '@/lib/caption/ass-generator';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clip = await prisma.clip.findUnique({ where: { id: params.id }, include: { project: true } });
    if (!clip) return NextResponse.json({ status: false, message: 'Clip not found' }, { status: 404 });

    const body = await req.json().catch(()=> ({}));
    const captionStyle = body.captionStyle || clip.captionStyle || 'tiktok';
    const cropMode = body.cropMode || clip.cropMode || 'smart';

    // Generate subtitle ASS if captions exist
    const captions = await prisma.caption.findMany({ where: { clipId: clip.id }, orderBy: { start: 'asc' } });

    let subtitlePath: string | undefined;
    if (captions.length > 0) {
      const tmpDir = path.resolve('./tmp/subs');
      await fs.mkdir(tmpDir, { recursive: true });
      const assPath = path.join(tmpDir, `clip-${clip.id}.ass`);
      await generateAssFile(captions.map(c=> ({ word: c.word, start: c.start, end: c.end })), captionStyle as any, assPath, body.captionMode || 'word');
      subtitlePath = assPath;
    }

    await prisma.clip.update({ where: { id: clip.id }, data: { captionStyle, cropMode, status: 'PROCESSING' } });

    const job = await videoQueue.add('clip-render', {
      type: 'CLIP_RENDER',
      projectId: clip.projectId,
      clipId: clip.id,
      payload: { captionStyle, cropMode, subtitlePath, aspectRatio: clip.aspectRatio }
    });

    await prisma.processingJob.create({ data: { projectId: clip.projectId, clipId: clip.id, type: 'CLIP_RENDER', status: 'QUEUED', bullMqJobId: job.id, payload: { captionStyle, cropMode } as any } });

    return NextResponse.json({ status: true, message: 'Render queued', data: { jobId: job.id } });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const clip = await prisma.clip.findUnique({ where: { id: params.id }, include: { captions: true, project: true } });
  if (!clip) return NextResponse.json({ status: false, message: 'Clip not found' }, { status: 404 });
  return NextResponse.json({ status: true, data: clip });
}
