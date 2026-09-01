import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get('path');
  if (!filePath) return NextResponse.json({ status: false, message: 'No path' }, { status: 400 });
  if (filePath.includes('..')) return NextResponse.json({ status: false, message: 'Invalid path' }, { status: 400 });

  const absPath = path.resolve(process.env.OUTPUT_PATH || './outputs', filePath);
  if (!fs.existsSync(absPath)) return NextResponse.json({ status: false, message: 'File not found' }, { status: 404 });

  const fileBuffer = fs.readFileSync(absPath);
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${path.basename(absPath)}"`
    }
  });
}
