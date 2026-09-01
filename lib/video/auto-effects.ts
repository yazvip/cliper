import { AutoEffect } from '../caption/emoji-sfx';

export interface RenderWithEffectsOptions {
  inputPath: string;
  outputPath: string;
  start: number;
  end: number;
  effects: AutoEffect[];
  subtitlePath?: string;
  aspectRatio: 'AR_9_16' | 'AR_16_9' | 'AR_1_1';
}

export async function renderClipWithEffects(opts: RenderWithEffectsOptions) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  const duration = opts.end - opts.start;
  const start = opts.start.toFixed(3);
  const dur = duration.toFixed(3);

  // Base crop
  let vf = '';
  if (opts.aspectRatio === 'AR_9_16') {
    vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
  } else if (opts.aspectRatio === 'AR_1_1') {
    vf = 'scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080';
  } else {
    vf = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
  }

  // Add auto zoom effects via sendcmd or zoompan
  // Simplified: if any zoom effect, add zoompan
  const hasZoom = opts.effects.some(e => e.type === 'zoom');
  if (hasZoom) {
    // For viral style, add slight dynamic zoom throughout
    vf += ',zoompan=z=\'min(zoom+0.0015,1.2)\':d=1:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2)';
  }

  // Add vibrant filter if positive effects
  const hasVibrant = opts.effects.some(e => e.type === 'filter' && e.value === 'vibrant');
  if (hasVibrant) {
    vf += ',eq=saturation=1.3:contrast=1.1';
  }

  // Subtitles
  if (opts.subtitlePath) {
    const subPath = opts.subtitlePath.replace(/\\/g,'/').replace(/:/g,'\\:');
    vf += `,subtitles=${subPath}:force_style='FontName=Anton,FontSize=36,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=6'`;
  }

  const cmd = `ffmpeg -y -ss ${start} -i "${opts.inputPath}" -t ${dur} -vf "${vf}" -c:v libx264 -preset veryfast -crf 28 -c:a aac -b:a 128k "${opts.outputPath}"`;

  try {
    await execAsync(cmd, { timeout: 300000 });
  } catch (e:any) {
    throw new Error(`FFmpeg with effects failed: ${e.message}`);
  }
}
