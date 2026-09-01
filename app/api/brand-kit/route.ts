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
    const kits = await prisma.brandKit.findMany({ where: { userId } });
    return NextResponse.json({ status: true, data: kits });
  } catch (e:any) {
    return NextResponse.json({ status: true, data: [] });
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
    const kit = await prisma.brandKit.create({ data: {
      userId, name: body.name, brandName: body.brandName, primaryColor: body.primaryColor || '#8b5cf6',
      secondaryColor: body.secondaryColor || '#000000', fontFamily: body.fontFamily || 'Inter',
      logoPath: body.logoPath, watermarkPath: body.watermarkPath
    }});
    return NextResponse.json({ status: true, data: kit });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
