import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: any = { timestamp: new Date().toISOString(), status: 'ok', services: {} };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.postgres = 'up';
  } catch (e:any) {
    checks.services.postgres = 'down: ' + e.message;
    checks.status = 'degraded';
  }

  try {
    await redis.ping();
    checks.services.redis = 'up';
  } catch (e:any) {
    checks.services.redis = 'down: ' + e.message;
    checks.status = 'degraded';
  }

  try {
    const { execSync } = require('child_process');
    execSync('ffmpeg -version', { stdio: 'ignore' });
    checks.services.ffmpeg = 'up';
  } catch {
    // Check via docker
    checks.services.ffmpeg = 'unknown (check worker container)';
  }

  try {
    const stat = fs.statfsSync('./');
    const freeGb = (stat.bfree * stat.bsize) / 1024 / 1024 / 1024;
    checks.services.disk_free_gb = freeGb.toFixed(2);
    if (freeGb < 2) checks.status = 'degraded';
  } catch {}

  try {
    const jobs = await prisma.processingJob.count({ where: { status: 'QUEUED' } });
    checks.services.queue_pending = jobs;
  } catch {}

  const statusCode = checks.status === 'ok' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
