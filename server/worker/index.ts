import { Worker } from 'bullmq';
import { redis } from '../../lib/redis';
import { prisma } from '../../lib/prisma';
import { VIDEO_QUEUE, VideoJobData } from '../../lib/queue';
import { getVideoMetadata } from '../../lib/video/ffprobe';
import { renderClip } from '../../lib/video/ffmpeg';
import { getAIProvider } from '../../lib/ai/provider';
import path from 'path';

console.log('🚀 Worker starting, queue:', VIDEO_QUEUE);

const worker = new Worker<VideoJobData>(VIDEO_QUEUE, async job => {
  const { type, projectId, videoId, clipId, payload } = job.data;
  console.log(`Processing job ${job.id} type ${type} project ${projectId}`);

  if (!projectId) throw new Error(`Job ${job.id} is missing projectId`);

  await prisma.processingJob.updateMany({ where: { bullMqJobId: job.id }, data: { status: 'PROCESSING', progress: 10 } });

  try {
    if (type === 'FFPROBE') {
      const video = await prisma.video.findUnique({ where: { id: videoId } });
      if (!video) throw new Error('Video not found');
      const absPath = path.resolve(process.env.STORAGE_PATH || './uploads', video.storedPath);
      const meta = await getVideoMetadata(absPath);
      await prisma.video.update({ where: { id: videoId }, data: {
        duration: meta.duration, width: meta.width, height: meta.height, fps: meta.fps,
        codec: meta.codec, bitrate: meta.bitrate, audioCodec: meta.audioCodec,
        audioChannels: meta.audioChannels, hasAudio: meta.hasAudio, ffprobeJson: meta.raw as any
      }});
      await prisma.project.update({ where: { id: projectId }, data: { status: 'TRANSCRIBING' } });
      await job.updateProgress(100);
    }

    if (type === 'TRANSCRIBE') {
      const provider = await getAIProvider();
      const video = await prisma.video.findUnique({ where: { id: videoId } });
      if (!video) throw new Error('Video not found');
      const absPath = path.resolve(process.env.STORAGE_PATH || './uploads', video.storedPath);
      const result = await provider.transcribe(absPath);
      const transcript = await prisma.transcript.create({ data: { videoId: videoId!, fullText: result.text, language: result.language } });
      if (result.words.length) {
        await prisma.transcriptWord.createMany({ data: result.words.map(w=> ({ transcriptId: transcript.id, word: w.word, start: w.start, end: w.end, confidence: w.confidence })) });
      }
      await prisma.project.update({ where: { id: projectId }, data: { status: 'ANALYZING' } });
      await job.updateProgress(100);
    }

    if (type === 'HIGHLIGHT_DETECT') {
      const project = await prisma.project.findUnique({ where: { id: projectId }, include: { videos: { include: { transcript: { include: { words: true } } } } } });
      if (!project) throw new Error('Project not found');
      const video = project.videos[0];
      const transcript = video?.transcript;
      if (!transcript) throw new Error('Transcript not found');
      const provider = await getAIProvider();
      const words = transcript.words.map(w=> ({ word: w.word, start: w.start, end: w.end, confidence: w.confidence }));
      const highlights = await provider.detectHighlights(transcript.fullText, words, {
        clipCount: project.clipCount, clipDuration: project.clipDuration, style: project.style, intensity: project.aiIntensity
      });
      for (const h of highlights) {
        await prisma.clip.create({ data: {
          projectId, startTime: h.start, endTime: h.end, duration: h.end - h.start,
          title: h.title, hook: h.hook, description: h.description, hashtags: h.hashtags || [],
          score: h.score, hookScore: h.hookScore, engagementScore: h.engagementScore,
          emotionScore: h.emotionScore, infoScore: h.infoScore, reason: h.reason,
          aspectRatio: project.aspectRatio as any, status: 'PENDING'
        }});
      }
      await prisma.project.update({ where: { id: projectId }, data: { status: 'CLIPPING' } });
      await job.updateProgress(100);
    }

    if (type === 'CLIP_RENDER' && clipId) {
      const clip = await prisma.clip.findUnique({ where: { id: clipId }, include: { project: true } });
      if (!clip) throw new Error('Clip not found');
      const video = await prisma.video.findFirst({ where: { projectId } });
      if (!video) throw new Error('Video not found');
      const inputPath = path.resolve(process.env.STORAGE_PATH || './uploads', video.storedPath);
      const outputDir = path.resolve(process.env.OUTPUT_PATH || './outputs', projectId);
      const { mkdir } = await import('fs/promises'); await mkdir(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, `clip-${clip.id}.mp4`);
      await renderClip({ inputPath, outputPath, start: clip.startTime, end: clip.endTime, aspectRatio: clip.aspectRatio as any, cropMode: clip.cropMode });
      await prisma.clip.update({ where: { id: clipId }, data: { status: 'COMPLETED', outputPath: path.join(projectId, `clip-${clip.id}.mp4`), renderedAt: new Date() } });
      await job.updateProgress(100);
    }

    await prisma.processingJob.updateMany({ where: { bullMqJobId: job.id }, data: { status: 'COMPLETED', progress: 100 } });
  } catch (e:any) {
    console.error('Job failed', job.id, e);
    await prisma.processingJob.updateMany({ where: { bullMqJobId: job.id }, data: { status: 'FAILED', error: e.message } });
    await prisma.systemLog.create({ data: { level: 'error', service: 'video-worker', jobId: job.id, message: e.message, meta: { projectId, type } as any } });
    throw e;
  }
}, { connection: redis, concurrency: 2 });

worker.on('completed', job => console.log(`✅ Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} failed`, err.message));
