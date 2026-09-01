import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.systemLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ status: true, data: logs });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
