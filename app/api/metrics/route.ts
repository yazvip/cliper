import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [projects, clips, jobsQueued, jobsFailed, users] = await Promise.all([
      prisma.project.count(),
      prisma.clip.count(),
      prisma.processingJob.count({ where: { status: 'QUEUED' } }),
      prisma.processingJob.count({ where: { status: 'FAILED' } }),
      prisma.user.count(),
    ]);

    const metrics = `
# HELP autoclipper_projects_total Total projects
# TYPE autoclipper_projects_total gauge
autoclipper_projects_total ${projects}

# HELP autoclipper_clips_total Total clips
# TYPE autoclipper_clips_total gauge
autoclipper_clips_total ${clips}

# HELP autoclipper_jobs_queued Jobs queued
# TYPE autoclipper_jobs_queued gauge
autoclipper_jobs_queued ${jobsQueued}

# HELP autoclipper_jobs_failed Jobs failed
# TYPE autoclipper_jobs_failed gauge
autoclipper_jobs_failed ${jobsFailed}

# HELP autoclipper_users_total Total users
# TYPE autoclipper_users_total gauge
autoclipper_users_total ${users}
`;

    return new NextResponse(metrics, { headers: { 'Content-Type': 'text/plain' } });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
