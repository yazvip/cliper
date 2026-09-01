import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    let userId = user?.id;
    if (!userId) {
      const demo = await prisma.user.upsert({ where: { email: 'demo@autoclipper.local' }, update: {}, create: { email: 'demo@autoclipper.local', passwordHash: 'demo', name: 'Demo' } });
      userId = demo.id;
    }
    const templates = await prisma.template.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ status: true, data: templates });
  } catch (e:any) {
    return NextResponse.json({ status: true, data: [
      { id: 't1', name: 'TikTok Viral Bold', aspectRatio: 'AR_9_16', captionStyle: 'tiktok', primaryColor: '#ffffff', fontFamily: 'Anton' },
      { id: 't2', name: 'Podcast Clean', aspectRatio: 'AR_9_16', captionStyle: 'podcast', primaryColor: '#FFFF99', fontFamily: 'Inter' },
    ]});
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await getCurrentUser();
    let userId = user?.id;
    if (!userId) {
      const demo = await prisma.user.upsert({ where: { email: 'demo@autoclipper.local' }, update: {}, create: { email: 'demo@autoclipper.local', passwordHash: 'demo', name: 'Demo' } });
      userId = demo.id;
    }
    const template = await prisma.template.create({ data: {
      userId, name: body.name, aspectRatio: body.aspectRatio || 'AR_9_16',
      captionStyle: body.captionStyle || 'tiktok', fontFamily: body.fontFamily || 'Inter',
      primaryColor: body.primaryColor || '#ffffff', secondaryColor: body.secondaryColor || '#000000',
      backgroundColor: body.backgroundColor || '#000000', config: body.config || {}
    }});
    return NextResponse.json({ status: true, message: 'Template created', data: template });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
