import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const clip = await prisma.clip.update({ where: { id: params.id }, data: {
      title: body.title,
      hook: body.hook,
      description: body.description,
      hashtags: body.hashtags,
      captionStyle: body.captionStyle,
      cropMode: body.cropMode,
      aspectRatio: body.aspectRatio,
      startTime: body.startTime,
      endTime: body.endTime,
      duration: body.endTime && body.startTime ? body.endTime - body.startTime : undefined
    }});
    return NextResponse.json({ status: true, message: 'Updated', data: clip });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.clip.delete({ where: { id: params.id } });
    return NextResponse.json({ status: true, message: 'Deleted' });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
