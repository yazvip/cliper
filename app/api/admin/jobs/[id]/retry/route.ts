import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { videoQueue } from '@/lib/queue';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await prisma.processingJob.findUnique({ where: { id: params.id } });
    if (!job) return NextResponse.json({ status: false, message: 'Job not found' }, { status: 404 });

    const newJob = await videoQueue.add(job.type, { type: job.type as any, projectId: job.projectId!, clipId: job.clipId || undefined, payload: job.payload });
    await prisma.processingJob.update({ where: { id: params.id }, data: { status: 'QUEUED', bullMqJobId: newJob.id, attempts: { increment: 1 }, error: null } });

    return NextResponse.json({ status: true, message: 'Job retried', data: { newJobId: newJob.id } });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
