import { NextResponse } from 'next/server';
import { videoQueue } from '@/lib/queue';

export async function POST() {
  try {
    await videoQueue.drain();
    await videoQueue.clean(0, 1000, 'failed');
    return NextResponse.json({ status: true, message: 'Queue cleared' });
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
