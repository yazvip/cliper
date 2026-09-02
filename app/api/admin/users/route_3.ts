import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as any).role !== 'ADMIN') {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 401 });
    }
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { projects: true } } }
    });
    const data = users.map((u: any) => ({
      ...u,
      projectsCount: u._count.projects,
      passwordHash: undefined
    }));
    return NextResponse.json({ status: true, data });
  } catch (e: any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
