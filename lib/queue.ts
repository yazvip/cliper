import { Queue } from 'bullmq';
import { redis } from './redis';
export const VIDEO_QUEUE = 'video-processing';

export const videoQueue = new Queue(VIDEO_QUEUE, {
  connection: redis,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 50 }
});

export type VideoJobData = {
  type: 'FFPROBE' | 'TRANSCRIBE' | 'HIGHLIGHT_DETECT' | 'CLIP_RENDER';
  projectId: string;
  videoId?: string;
  clipId?: string;
  payload?: any;
};
