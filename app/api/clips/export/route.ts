import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clipIds: string[] = body.clipIds || [];
    const projectId = body.projectId;

    let clips;
    if (clipIds.length) clips = await prisma.clip.findMany({ where: { id: { in: clipIds } } });
    else if (projectId) clips = await prisma.clip.findMany({ where: { projectId } });
    else return NextResponse.json({ status: false, message: 'Provide clipIds or projectId' }, { status: 400 });

    const outputPaths = clips.filter(c=> c.outputPath).map(c=> path.resolve(process.env.OUTPUT_PATH || './outputs', c.outputPath!)).filter(p=> fs.existsSync(p));

    return NextResponse.json({ status: true, message: 'Export ready', data: { count: outputPaths.length, clips: clips.map(c=> ({ id: c.id, title: c.title, outputPath: c.outputPath, downloadUrl: `/api/download?path=${encodeURIComponent(c.outputPath||'')}` })) } });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
