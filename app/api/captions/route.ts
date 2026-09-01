import { NextRequest, NextResponse } from 'next/server';
import { CAPTION_STYLES } from '@/lib/caption/styles';

export async function GET() {
  return NextResponse.json({ status: true, data: Object.entries(CAPTION_STYLES).map(([name, cfg])=> ({ name, ...cfg })) });
}
