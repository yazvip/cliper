export type CaptionStyleName = 'clean' | 'bold' | 'tiktok' | 'podcast' | 'minimal' | 'gaming' | 'highlight';

export interface CaptionStyleConfig {
  fontName: string;
  fontSize: number;
  primaryColor: string; // ASS &H format
  outlineColor: string;
  backColor: string;
  bold: boolean;
  italic: boolean;
  alignment: number; // 1-9
  marginV: number;
  outline: number;
  shadow: number;
  borderStyle: number;
  animation?: 'pop' | 'fade' | 'slide' | 'bounce';
}

export const CAPTION_STYLES: Record<CaptionStyleName, CaptionStyleConfig> = {
  clean: {
    fontName: 'Inter', fontSize: 24, primaryColor: '&H00FFFFFF', outlineColor: '&H00000000',
    backColor: '&H80000000', bold: false, italic: false, alignment: 2, marginV: 60, outline: 2, shadow: 1, borderStyle: 3
  },
  bold: {
    fontName: 'Inter', fontSize: 32, primaryColor: '&H00FFFFFF', outlineColor: '&H00000000',
    backColor: '&H00000000', bold: true, italic: false, alignment: 2, marginV: 80, outline: 4, shadow: 2, borderStyle: 1
  },
  tiktok: {
    fontName: 'Anton', fontSize: 36, primaryColor: '&H00FFFFFF', outlineColor: '&H00000000',
    backColor: '&H00000000', bold: true, italic: false, alignment: 2, marginV: 200, outline: 6, shadow: 3, borderStyle: 1, animation: 'pop'
  },
  podcast: {
    fontName: 'Inter', fontSize: 22, primaryColor: '&H00FFFF99', outlineColor: '&H00000000',
    backColor: '&HAA000000', bold: false, italic: false, alignment: 2, marginV: 40, outline: 1, shadow: 0, borderStyle: 3
  },
  minimal: {
    fontName: 'Inter', fontSize: 20, primaryColor: '&H00FFFFFF', outlineColor: '&H00000000',
    backColor: '&H00000000', bold: false, italic: false, alignment: 2, marginV: 50, outline: 1, shadow: 0, borderStyle: 1
  },
  gaming: {
    fontName: 'Orbitron', fontSize: 28, primaryColor: '&H0000FF00', outlineColor: '&H000000FF',
    backColor: '&H80000000', bold: true, italic: false, alignment: 2, marginV: 70, outline: 3, shadow: 2, borderStyle: 1, animation: 'bounce'
  },
  highlight: {
    fontName: 'Inter', fontSize: 30, primaryColor: '&H0000FFFF', outlineColor: '&H00000000',
    backColor: '&H00000000', bold: true, italic: false, alignment: 2, marginV: 100, outline: 4, shadow: 2, borderStyle: 1, animation: 'pop'
  }
};

export function getCaptionStyle(name: string): CaptionStyleConfig {
  return CAPTION_STYLES[name as CaptionStyleName] || CAPTION_STYLES.tiktok;
}
