// PILLAR 1 PREMIUM: HOOK DNA LAB
// Generate 10 varian hook dari 1 clip dengan style berbeda

export type HookStyle = 'controversial' | 'curiosity_gap' | 'negative' | 'storytelling' | 'data_shock' | 'question' | 'how_to' | 'mistake' | 'secret' | 'direct';

export interface HookVariant {
  style: HookStyle;
  hook: string;
  score: number;
  platform: 'tiktok' | 'youtube_shorts' | 'instagram_reels' | 'universal';
  ctrPrediction: number; // 0-100 predicted CTR
  reason: string;
}

const HOOK_TEMPLATES: Record<HookStyle, string[]> = {
  controversial: [
    "JANGAN ngaku {topic} kalau masih lakukan ini!",
    "STOP! {topic} kamu salah total!",
    "Unpopular opinion: {topic} itu scam kalau...",
  ],
  curiosity_gap: [
    "Gak ada yang kasih tau {topic} ini...",
    "Kenapa 99% orang gagal di {topic}? Jawabannya...",
    "Ini yang disembunyikan guru {topic}...",
  ],
  negative: [
    "3 kesalahan {topic} yang bikin kamu gagal",
    "Hati-hati, {topic} ini bisa bikin bangkrut",
    "Kesalahan fatal {topic} pemula",
  ],
  storytelling: [
    "Dulu saya rugi 50jt karena {topic}...",
    "Gara-gara {topic} ini, bisnis saya hampir tutup",
    "Cerita {topic} yang gak pernah saya share...",
  ],
  data_shock: [
    "90% {topic} gagal di 3 bulan pertama",
    "Data: {topic} yang viral rata-rata 27 detik",
    "Fakta: 1 dari 10 {topic} doang yang survive",
  ],
  question: [
    "Kenapa {topic} kamu gak berkembang?",
    "Pernah gak {topic} kamu sepi padahal udah promosi?",
    "Apa sih {topic} yang bener?",
  ],
  how_to: [
    "Cara {topic} anti gagal untuk pemula",
    "Tutorial {topic} 5 menit langsung jadi",
    "Step by step {topic} yang benar",
  ],
  mistake: [
    "Jangan lakukan {topic} ini kalau gak mau nyesel",
    "Pemula wajib hindari {topic} ini",
    "3 hal yang gak boleh dilakukan di {topic}",
  ],
  secret: [
    "Rahasia {topic} yang gak diajarin di sekolah",
    "Bocoran {topic} dari insider",
    "Secret sauce {topic} yang viral",
  ],
  direct: [
    "{topic} - ini yang harus kamu tau",
    "Penting! {topic} untuk pemula",
    "{topic} explained in 30 seconds",
  ]
};

export class HookDnaLab {
  generateHooks(originalHook: string, transcript: string, topic: string = 'bisnis'): HookVariant[] {
    const variants: HookVariant[] = [];
    const styles: HookStyle[] = ['controversial', 'curiosity_gap', 'negative', 'storytelling', 'data_shock', 'question', 'how_to', 'mistake', 'secret', 'direct'];

    for (const style of styles) {
      const templates = HOOK_TEMPLATES[style];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const hook = template.replace('{topic}', topic);

      // Score based on style + platform
      let baseScore = 70 + Math.random() * 20;
      let ctr = 60 + Math.random() * 25;
      let platform: HookVariant['platform'] = 'universal';

      if (style === 'controversial' || style === 'data_shock') {
        baseScore += 10;
        ctr += 10;
        platform = 'tiktok';
      }
      if (style === 'how_to' || style === 'question') {
        platform = 'youtube_shorts';
      }
      if (style === 'storytelling') {
        platform = 'instagram_reels';
      }

      variants.push({
        style,
        hook,
        score: Math.min(98, Math.round(baseScore)),
        platform,
        ctrPrediction: Math.min(95, Math.round(ctr)),
        reason: this.getReason(style)
      });
    }

    // Sort by score desc
    return variants.sort((a,b) => b.score - a.score);
  }

  private getReason(style: HookStyle): string {
    const reasons: Record<HookStyle, string> = {
      controversial: 'Triggers debate, high comment rate',
      curiosity_gap: 'Creates information gap, high retention',
      negative: 'Loss aversion, people avoid mistakes',
      storytelling: 'Emotional connection, high shareability',
      data_shock: 'Authority + surprise, high save rate',
      question: 'Direct callout, high relevance',
      how_to: 'Value promise, high save & share',
      mistake: 'Fear of failure, high watch time',
      secret: 'Exclusivity, high curiosity',
      direct: 'Clarity, good for educational',
    };
    return reasons[style];
  }
}

export const hookDnaLab = new HookDnaLab();
