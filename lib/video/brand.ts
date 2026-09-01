import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export interface BrandOverlayOptions {
  inputPath: string;
  outputPath: string;
  logoPath?: string;
  watermarkPath?: string;
  primaryColor?: string;
  brandName?: string;
}

export async function applyBrandKit(opts: BrandOverlayOptions) {
  // For now, simple overlay if logo/watermark exists
  // Complex version would add text with drawtext and color
  if (!opts.logoPath && !opts.watermarkPath) {
    // No brand, just copy
    const cmd = `ffmpeg -y -i "${opts.inputPath}" -c copy "${opts.outputPath}"`;
    await execAsync(cmd);
    return;
  }

  let filter = '';
  let inputs = `-i "${opts.inputPath}"`;
  let inputCount = 1;

  if (opts.logoPath) {
    inputs += ` -i "${opts.logoPath}"`;
    filter += `[${inputCount}:v]scale=200:200[logo];[0:v][logo]overlay=10:10:enable='between(t,0,1000)'[tmp1];`;
    inputCount++;
  }

  if (opts.watermarkPath) {
    const prev = filter ? '[tmp1]' : '[0:v]';
    inputs += ` -i "${opts.watermarkPath}"`;
    filter += `[${inputCount}:v]scale=300:100[wm];${prev}[wm]overlay=W-w-10:H-h-10[final];`;
  } else {
    filter = filter.replace('[tmp1]', '[final]');
  }

  if (!filter) filter = '[0:v]copy[final]';

  const cmd = `ffmpeg -y ${inputs} -filter_complex "${filter}" -map "[final]" -map 0:a? -c:v libx264 -preset fast -crf 23 -c:a aac "${opts.outputPath}"`;
  await execAsync(cmd);
}
