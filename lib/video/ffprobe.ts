import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export interface VideoMetadata {
  duration: number;
  width: number; height: number;
  fps: number; codec: string; bitrate: number;
  audioCodec?: string; audioChannels?: number; hasAudio: boolean;
  raw: any;
}

export async function getVideoMetadata(filePath: string): Promise<VideoMetadata> {
  // Use ffprobe - escape path safely
  const safePath = filePath.replace(/"/g, '\\"');
  const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${safePath}"`;
  try {
    const { stdout } = await execAsync(cmd);
    const data = JSON.parse(stdout);
    const vStream = data.streams.find((s:any)=> s.codec_type==='video');
    const aStream = data.streams.find((s:any)=> s.codec_type==='audio');
    const duration = parseFloat(data.format.duration || vStream?.duration || '0');
    let fps = 30;
    if (vStream?.avg_frame_rate) {
      const [num, den] = vStream.avg_frame_rate.split('/').map(Number);
      if (den) fps = num/den;
    }
    return {
      duration,
      width: vStream?.width || 0,
      height: vStream?.height || 0,
      fps,
      codec: vStream?.codec_name || 'unknown',
      bitrate: parseInt(data.format.bit_rate || '0'),
      audioCodec: aStream?.codec_name,
      audioChannels: aStream?.channels,
      hasAudio: !!aStream,
      raw: data
    };
  } catch (e:any) {
    throw new Error(`FFprobe failed: ${e.message}`);
  }
}
