import { CAPTION_STYLES, getCaptionStyle, CaptionStyleName } from './styles';
import fs from 'fs/promises';
import path from 'path';

export interface WordCaption {
  word: string;
  start: number;
  end: number;
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${cs.toString().padStart(2,'0')}`;
}

export async function generateAssFile(captions: WordCaption[], styleName: CaptionStyleName, outputPath: string, mode: 'word' | 'phrase' | 'sentence' = 'word') {
  const style = getCaptionStyle(styleName);

  let grouped: { text: string; start: number; end: number }[] = [];

  if (mode === 'word') {
    grouped = captions.map(c => ({ text: c.word.toUpperCase(), start: c.start, end: c.end }));
  } else if (mode === 'phrase') {
    // Group 3-4 words
    for (let i=0;i<captions.length;i+=3) {
      const slice = captions.slice(i, i+3);
      if (!slice.length) continue;
      grouped.push({ text: slice.map(s=>s.word).join(' '), start: slice[0].start, end: slice[slice.length-1].end });
    }
  } else {
    // sentence: group until punctuation or 10 words
    let current: WordCaption[] = [];
    for (const w of captions) {
      current.push(w);
      if (/[.!?]$/.test(w.word) || current.length >= 8) {
        grouped.push({ text: current.map(c=>c.word).join(' '), start: current[0].start, end: current[current.length-1].end });
        current = [];
      }
    }
    if (current.length) grouped.push({ text: current.map(c=>c.word).join(' '), start: current[0].start, end: current[current.length-1].end });
  }

  const header = `[Script Info]
Title: Auto Clipper Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontName},${style.fontSize},${style.primaryColor},&H000000FF,${style.outlineColor},${style.backColor},${style.bold ? -1 : 0},${style.italic ? -1 : 0},0,0,100,100,0,0,${style.borderStyle},${style.outline},${style.shadow},${style.alignment},10,10,${style.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = grouped.map(g => {
    const start = formatAssTime(g.start);
    const end = formatAssTime(g.end);
    let text = g.text;
    // Animation tags for tiktok pop effect
    if (style.animation === 'pop') {
      text = `{\an5\fscx0\fscy0\t(0,150,\fscx120\fscy120)\t(150,300,\fscx100\fscy100)}${text}`;
    } else if (style.animation === 'bounce') {
      text = `{\an5\t(0,200,\fscx110\fscy110)}${text}`;
    } else {
      text = `{\an5}${text}`;
    }
    // Escape
    text = text.replace(/\n/g, ' ');
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
  }).join('\n');

  const content = header + events;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, 'utf-8');
  return outputPath;
}

export async function generateSrtFile(captions: WordCaption[], outputPath: string) {
  let srt = '';
  let idx = 1;
  for (const c of captions) {
    const start = new Date(c.start * 1000).toISOString().substr(11, 12).replace('.', ',');
    const end = new Date(c.end * 1000).toISOString().substr(11, 12).replace('.', ',');
    // format 00:00:00,000
    const fmt = (sec: number) => {
      const h = Math.floor(sec/3600).toString().padStart(2,'0');
      const m = Math.floor((sec%3600)/60).toString().padStart(2,'0');
      const s = Math.floor(sec%60).toString().padStart(2,'0');
      const ms = Math.floor((sec%1)*1000).toString().padStart(3,'0');
      return `${h}:${m}:${s},${ms}`;
    };
    srt += `${idx}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.word}\n\n`;
    idx++;
  }
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, srt, 'utf-8');
  return outputPath;
}
