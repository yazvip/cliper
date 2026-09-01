import Redis from 'ioredis';
const globalForRedis = globalThis as unknown as { redis: Redis | undefined };
const url = process.env.REDIS_URL || 'redis://localhost:6379';
export const redis = globalForRedis.redis ?? new Redis(url, { maxRetriesPerRequest: null });
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
