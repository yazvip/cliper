import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { projects: true } } } });
    const data = users.map(u=> ({ ...u, projectsCount: (u as any)._count.projects, passwordHash: undefined }));
    return NextResponse.json({ status: true, data });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
