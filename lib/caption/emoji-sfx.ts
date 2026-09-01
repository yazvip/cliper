// PILLAR 1 PREMIUM: AUTO EMOJI, SFX & AUTO ZOOM (MrBeast Style)

export interface AutoEffect {
  time: number; // seconds
  type: 'emoji' | 'sfx' | 'zoom' | 'shake' | 'filter';
  value: string; // emoji char or sfx name or zoom level
  duration: number;
  reason: string;
}

const EMOJI_MAP: Record<string, string> = {
  'gagal': '💥', 'salah': '❌', 'bahaya': '⚠️', 'jangan': '🚫', 'stop': '🛑',
  'rahasia': '🤫', 'wow': '😱', 'gila': '🤯', 'uang': '💰', 'bisnis': '💼',
  'sukses': '🚀', 'mantap': '🔥', 'parah': '💀', 'cinta': '❤️', 'benci': '💔',
  'boom': '💥', 'meledak': '💥', 'viral': '📈', 'naik': '📈', 'turun': '📉',
  'gratis': '🎁', 'hadiah': '🎁', 'tips': '💡', 'ide': '💡',
};

const SFX_MAP: Record<string, string> = {
  'gagal': 'fail_buzzer', 'salah': 'error_pop', 'bahaya': 'alert_siren',
  'wow': 'wow_sound', 'boom': 'explosion', 'uang': 'cash_register',
  'sukses': 'success_fanfare', 'mantap': 'fire_crackle',
};

export class AutoEmojiSfxEngine {
  generateEffects(transcriptWords: { word: string; start: number; end: number }[]): AutoEffect[] {
    const effects: AutoEffect[] = [];

    for (const w of transcriptWords) {
      const clean = w.word.toLowerCase().replace(/[^a-z]/g, '');

      // Emoji
      if (EMOJI_MAP[clean]) {
        effects.push({
          time: w.start,
          type: 'emoji',
          value: EMOJI_MAP[clean],
          duration: 0.8,
          reason: `Keyword "${clean}" triggers emoji ${EMOJI_MAP[clean]}`
        });
      }

      // SFX
      if (SFX_MAP[clean]) {
        effects.push({
          time: w.start,
          type: 'sfx',
          value: SFX_MAP[clean],
          duration: 0.5,
          reason: `Keyword "${clean}" triggers SFX ${SFX_MAP[clean]}`
        });
      }

      // Auto Zoom on strong words (caps or exclamation)
      if (w.word === w.word.toUpperCase() && w.word.length > 3) {
        effects.push({
          time: w.start,
          type: 'zoom',
          value: '120',
          duration: 0.6,
          reason: `All caps word "${w.word}" triggers zoom 120%`
        });
      }

      // Shake on negative
      if (['gagal', 'hancur', 'bangkrut', 'rugi'].includes(clean)) {
        effects.push({
          time: w.start,
          type: 'shake',
          value: 'medium',
          duration: 0.4,
          reason: `Negative word "${clean}" triggers shake`
        });
      }

      // Filter vibrant on positive
      if (['sukses', 'mantap', 'keren', 'viral'].includes(clean)) {
        effects.push({
          time: w.start,
          type: 'filter',
          value: 'vibrant',
          duration: 1.0,
          reason: `Positive word "${clean}" triggers vibrant filter`
        });
      }
    }

    return effects.sort((a,b) => a.time - b.time);
  }

  // Generate FFmpeg filter for auto effects
  generateFFmpegFilter(effects: AutoEffect[], duration: number): string {
    // For demo, return zoompan and eq filters
    // Real implementation would generate complex filter with timeline
    const zoomEffects = effects.filter(e => e.type === 'zoom');
    if (!zoomEffects.length) return '';

    // Example: zoom at specific times
    // This is simplified - real would use sendcmd or complex timeline
    let filter = '';
    for (const eff of zoomEffects) {
      // Use zoompan filter at time
      // Note: precise timing needs sendcmd, simplified here
      filter += `zoompan=z='if(between(t,${eff.time},${eff.time + eff.duration}),1.2,1)':d=1,`;
    }
    return filter;
  }
}

export const autoEmojiSfxEngine = new AutoEmojiSfxEngine();
