import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const videoQueue = new Queue('video-processing', { connection });
export const clipQueue = new Queue('clip-render', { connection });

export const queueEvents = new QueueEvents('video-processing', { connection });

export function createWorker() {
  // Worker logic in server/worker/index.ts
  return null;
}

export { connection };
