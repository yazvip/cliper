import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    // Allow demo without auth for development
    const where = user ? { userId: user.id } : {};
    const projects = await prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, include: { _count: { select: { clips: true } } } });
    const data = projects.map(p=> ({ ...p, clipsCount: (p as any)._count?.clips || 0 }));
    return NextResponse.json({ status: true, message: 'success', data });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    // Create demo user if not auth
    let userId = user?.id;
    if (!userId) {
      const demo = await prisma.user.upsert({ where: { email: 'demo@autoclipper.local' }, update: {}, create: { email: 'demo@autoclipper.local', passwordHash: 'demo', name: 'Demo User' } });
      userId = demo.id;
    }
    const project = await prisma.project.create({ data: { userId, title: body.title || 'Untitled Project', description: body.description, clipCount: body.clipCount||5, clipDuration: body.clipDuration||30, aspectRatio: body.aspectRatio||'AR_9_16', platform: body.platform||'TIKTOK', style: body.style||'VIRAL' } });
    return NextResponse.json({ status: true, message: 'Project created', data: project });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
