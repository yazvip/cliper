import { AIProvider, HighlightSegment, TranscriptWord } from './types';

export class MockAIProvider implements AIProvider {
  name = 'mock';

  async transcribe(audioPath: string) {
    // Mock transcription for dev - returns dummy words
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
      segments.push({
        start, end, score: baseScore,
        hookScore: 80+Math.random()*15,
        engagementScore: 70+Math.random()*20,
        emotionScore: 60+Math.random()*20,
        infoScore: 85+Math.random()*10,
        storyScore: 70+Math.random()*20,
        completenessScore: 75+Math.random()*15,
        hook: hooks[i % hooks.length],
        reason: "Strong hook, high information value, emotional trigger",
        title: `Kesalahan Bisnis #${i+1} yang Wajib Dihindari`,
        description: "Tips bisnis untuk pemula agar tidak gagal di awal perjalanan.",
        hashtags: ["#bisnis", "#usahakecil", "#tipsbisnis", "#entrepreneur"]
      });
    }
    return segments.sort((a,b)=> b.score-a.score);
  }

  async generateTitles(hook: string, transcriptSlice: string) {
    return {
      titles: [
        "3 Kesalahan Bisnis Pemula yang Sering Terjadi",
        "Jangan Lakukan Ini Kalau Mau Bisnis Berhasil",
        "Kenapa Bisnis Kamu Gagal? Ini Alasannya",
        "Tips Bisnis Anti Gagal untuk Pemula",
        "Rahasia Sukses Bisnis dari Nol"
      ],
      hooks: [
        "Jangan mulai bisnis sebelum tahu ini.",
        "90% orang melakukan kesalahan ini.",
        "Ini alasan bisnis Anda tidak berkembang.",
        "Stop lakukan kesalahan ini!",
        "Pemula wajib tahu!"
      ],
      description: "Di video ini kita bahas kesalahan umum pemula dalam membangun bisnis dan cara menghindarinya. Cocok untuk kamu yang baru mulai usaha.",
      hashtags: ["#bisnis", "#bisnispemula", "#tipsbisnis", "#wirausaha", "#motivasibisnis"]
    };
  }
}
