import { AIProvider, HighlightSegment, TranscriptWord } from './types';
import { viralScoreEngine } from './viral-score';
import { hookDnaLab } from './hook-dna';
import { autoEmojiSfxEngine } from '../caption/emoji-sfx';

export class MockAIProvider implements AIProvider {
  name = 'mock';

  async transcribe(audioPath: string) {
    const mockText = "Halo semuanya, hari ini kita akan membahas tiga kesalahan bisnis yang sering dilakukan pemula. Kesalahan pertama adalah tidak melakukan riset pasar. Banyak orang langsung mulai bisnis tanpa tahu siapa target marketnya. Kesalahan kedua, mencampur keuangan pribadi dan bisnis. Ini fatal. Kesalahan ketiga, tidak konsisten dalam promosi.";
    const words = mockText.split(/\s+/).map((w,i)=> ({ word: w, start: i*0.5, end: i*0.5+0.4, confidence: 0.95 }));
    return { text: mockText, words, language: 'id' };
  }

  async detectHighlights(transcriptText: string, words: TranscriptWord[], options: { clipCount: number; clipDuration: number; style: string; intensity: string }): Promise<HighlightSegment[]> {
    const totalDuration = words.length ? words[words.length-1].end : 180;
    const clipDur = options.clipDuration || 30;
    const count = Math.min(options.clipCount || 5, Math.floor(totalDuration/clipDur) || 3);
    const segments: HighlightSegment[] = [];
    const hooks = [
      "Jangan mulai bisnis sebelum tahu ini!",
      "90% pemula melakukan kesalahan ini",
      "Ini alasan bisnis kamu gak berkembang",
      "Stop! Kamu mencampur keuangan?",
      "Rahasia riset pasar 5 menit"
    ];
    for (let i=0;i<count;i++) {
      const start = i * (totalDuration / count) + Math.random()*2;
      const end = Math.min(start + clipDur, totalDuration);
      const baseScore = 75 + Math.random()*20;

      // PREMIUM: Viral Score
      const sliceText = transcriptText.slice(Math.floor(start*2), Math.floor(end*2));
      const viral = viralScoreEngine.calculate(sliceText || hooks[i % hooks.length], clipDur, start);
      const hookVariants = hookDnaLab.generateHooks(hooks[i % hooks.length], sliceText, 'bisnis');
      const effects = autoEmojiSfxEngine.generateEffects(words.filter(w=> w.start >= start && w.end <= end));

      segments.push({
        start, end, score: baseScore,
        hookScore: viral.hookScore,
        engagementScore: viral.retentionScore,
        emotionScore: viral.emotionScore,
        infoScore: viral.breakdown.informationDensity,
        storyScore: 70+Math.random()*20,
        completenessScore: 75+Math.random()*15,
        hook: hooks[i % hooks.length],
        reason: viral.reasons.join(', ') + " | " + hookVariants[0].reason,
        title: `Kesalahan Bisnis #${i+1} yang Wajib Dihindari`,
        description: "Tips bisnis untuk pemula agar tidak gagal di awal perjalanan.",
        hashtags: ["#bisnis", "#usahakecil", "#tipsbisnis", "#entrepreneur"],
        // PREMIUM FIELDS
        viralProbability: viral.viralProbability,
        retentionScore: viral.retentionScore,
        shareabilityScore: viral.shareabilityScore,
        viralBreakdown: viral.breakdown as any,
        retentionCurve: viral.retentionCurve as any,
        hookVariants: hookVariants.slice(0,5) as any,
        autoEffects: effects as any,
        ctrPrediction: hookVariants[0].ctrPrediction
      } as any);
    }
    return segments.sort((a,b)=> (b as any).viralProbability - (a as any).viralProbability);
  }

  async generateTitles(hook: string, transcriptSlice: string) {
    const variants = hookDnaLab.generateHooks(hook, transcriptSlice, 'bisnis');
    return {
      titles: variants.slice(0,5).map(v=> v.hook),
      hooks: variants.map(v=> v.hook),
      description: "Di video ini kita bahas kesalahan umum pemula dalam membangun bisnis dan cara menghindarinya. Cocok untuk kamu yang baru mulai usaha.",
      hashtags: ["#bisnis", "#bisnispemula", "#tipsbisnis", "#wirausaha", "#motivasibisnis"],
      viralScore: 85,
      hookVariants: variants
    } as any;
  }
}
