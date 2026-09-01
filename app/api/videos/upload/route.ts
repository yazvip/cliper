import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storage } from '@/lib/storage/local';
import { videoQueue } from '@/lib/queue';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    const title = form.get('title') as string || 'Untitled';
    if (!file) return NextResponse.json({ status: false, message: 'No file' }, { status: 400 });

    const allowed = ['video/mp4','video/quicktime','video/webm','video/x-matroska','video/x-msvideo'];
    if (!allowed.includes(file.type)) return NextResponse.json({ status: false, message: `Unsupported mime ${file.type}` }, { status: 400 });
    if (file.size > 500*1024*1024) return NextResponse.json({ status: false, message: 'Max 500MB' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await storage.save(buffer, file.name, 'videos');

    const user = await getCurrentUser();
    let userId = user?.id;
    if (!userId) {
      const demo = await prisma.user.upsert({ where: { email: 'demo@autoclipper.local' }, update: {}, create: { email: 'demo@autoclipper.local', passwordHash: 'demo', name: 'Demo User' } });
      userId = demo.id;
    }

    const project = await prisma.project.create({ data: { userId, title, status: 'UPLOADING' } });
    const video = await prisma.video.create({ data: {
      projectId: project.id, originalFilename: file.name, storedPath: saved.path,
      mimeType: file.type, sizeBytes: file.size
    }});

    const job = await videoQueue.add('ffprobe', { type: 'FFPROBE', projectId: project.id, videoId: video.id });
    await prisma.processingJob.create({ data: { projectId: project.id, type: 'FFPROBE', status: 'QUEUED', bullMqJobId: job.id } });

    // Also queue transcribe after ffprobe - worker will chain, but for demo queue both
    const transcribeJob = await videoQueue.add('transcribe', { type: 'TRANSCRIBE', projectId: project.id, videoId: video.id }, { delay: 2000 });
    await prisma.processingJob.create({ data: { projectId: project.id, type: 'TRANSCRIBE', status: 'QUEUED', bullMqJobId: transcribeJob.id } });

    return NextResponse.json({ status: true, message: 'Upload success, processing started', data: { projectId: project.id, videoId: video.id } });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
