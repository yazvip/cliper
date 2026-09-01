import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
const execAsync = promisify(exec);

function escapeArg(arg: string): string {
  // Prevent command injection - only allow safe chars, reject ; & | ` $ ( )
  if (/[;&|`$()<>\n]/.test(arg)) throw new Error('Unsafe ffmpeg arg');
  return arg;
}

export interface ClipRenderOptions {
  inputPath: string;
  outputPath: string;
  start: number;
  end: number;
  aspectRatio: 'AR_9_16' | 'AR_16_9' | 'AR_1_1';
  cropMode: string;
  width?: number;
  height?: number;
  addSubtitles?: boolean;
  subtitlePath?: string;
}

export async function renderClip(opts: ClipRenderOptions): Promise<void> {
  const duration = opts.end - opts.start;
  if (duration <=0 || duration > 300) throw new Error('Invalid clip duration');
  const start = Math.max(0, opts.start).toFixed(3);
  const dur = duration.toFixed(3);

  // Validate paths - must not contain ..
  if (opts.inputPath.includes('..') || opts.outputPath.includes('..')) throw new Error('Path traversal blocked');

  let vf = '';
  if (opts.aspectRatio === 'AR_9_16') {
    // Smart crop: scale to fill 1080x1920 then crop center (fallback for face detection - enhanced version uses face detection coords)
    // For now: intelligent center crop, real face tracking will override x,y via AI
    if (opts.cropMode === 'smart' || opts.cropMode === 'center') {
      vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
    } else {
      vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
    }
  } else if (opts.aspectRatio === 'AR_1_1') {
    vf = 'scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080';
  } else {
    vf = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
  }

  if (opts.addSubtitles && opts.subtitlePath) {
    // Burn subtitles - escape : for ffmpeg filter
    const subPath = opts.subtitlePath.replace(/\\/g,'/').replace(/:/g,'\\:');
    vf += `,subtitles=${subPath}:force_style='FontName=Inter,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3'`;
  }

  const input = escapeArg(opts.inputPath);
  const output = escapeArg(opts.outputPath);

  const cmd = `ffmpeg -y -ss ${start} -i "${input}" -t ${dur} -vf "${vf}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${output}"`;

  try {
    await execAsync(cmd, { timeout: 300000 });
  } catch (e:any) {
    throw new Error(`FFmpeg clip render failed: ${e.message}`);
  }
}

export async function generateThumbnail(inputPath: string, outputPath: string, atSecond = 1) {
  const cmd = `ffmpeg -y -ss ${atSecond} -i "${inputPath.replace(/"/g,'\\"')}" -vframes 1 -q:v 2 "${outputPath.replace(/"/g,'\\"')}"`;
  await execAsync(cmd);
}
