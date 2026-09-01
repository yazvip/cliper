import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  const where = projectId ? { projectId } : {};
  try {
    const clips = await prisma.clip.findMany({ where, orderBy: { score: 'desc' } });
    return NextResponse.json({ status: true, message: 'success', data: clips });
  } catch (e:any) {
    // Fallback demo data
    return NextResponse.json({ status: true, message: 'success (demo)', data: [
      { id: 'demo1', projectId: projectId||'demo', startTime: 12, endTime: 42, duration: 30, title: 'Kesalahan Bisnis Pemula #1', hook: 'Jangan mulai bisnis sebelum tahu ini.', score: 92, status: 'COMPLETED', outputPath: null, aspectRatio: 'AR_9_16' },
      { id: 'demo2', projectId: projectId||'demo', startTime: 65, endTime: 95, duration: 30, title: 'Kenapa Bisnis Gagal?', hook: '90% orang melakukan kesalahan ini.', score: 88, status: 'PENDING', outputPath: null, aspectRatio: 'AR_9_16' },
    ]});
  }
}
