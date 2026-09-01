import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await prisma.processingJob.findFirst({ where: { OR: [{ id: params.id }, { bullMqJobId: params.id }] } });
    if (!job) return NextResponse.json({ status: false, message: 'Job not found' }, { status: 404 });
    return NextResponse.json({ status: true, message: 'success', data: job });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
