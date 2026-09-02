import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { videoQueue } from '@/lib/queue';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const project = await prisma.project.findUnique({ where: { id: params.id } });
    if (!project) return NextResponse.json({ status: false, message: 'Project not found' }, { status: 404 });

    await prisma.project.update({ where: { id: params.id }, data: {
      clipCount: body.clipCount || project.clipCount,
      clipDuration: body.clipDuration || project.clipDuration,
      aspectRatio: body.aspectRatio || project.aspectRatio,
      platform: body.platform || project.platform,
      style: body.style || project.style,
      aiIntensity: body.aiIntensity || project.aiIntensity,
      status: 'ANALYZING'
    }});

    const job = await videoQueue.add('highlight', { type: 'HIGHLIGHT_DETECT', projectId: params.id });
    await prisma.processingJob.create({ data: { projectId: params.id, type: 'HIGHLIGHT_DETECT', status: 'QUEUED', bullMqJobId: job.id, payload: body as any } });

    return NextResponse.json({ status: true, message: 'Clip generation queued', data: { jobId: job.id } });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
