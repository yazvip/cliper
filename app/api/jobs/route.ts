import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  const status = req.nextUrl.searchParams.get('status');
  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  try {
    const jobs = await prisma.processingJob.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ status: true, data: jobs });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
