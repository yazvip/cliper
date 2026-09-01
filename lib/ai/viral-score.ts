// PILLAR 1 PREMIUM: VIRAL SCORE PREDICTOR
// Prediksi viral probability 0-100% berdasarkan transcript + audio features

export interface ViralScoreResult {
  viralProbability: number; // 0-100
  hookScore: number;
  retentionScore: number;
  shareabilityScore: number;
  emotionScore: number;
  breakdown: {
    hookStrength: number;
    curiosityGap: number;
    controversy: number;
    informationDensity: number;
    emotionalTrigger: number;
    pacing: number;
  };
  retentionCurve: { time: number; attention: number }[]; // detik -> attention 0-100
  reasons: string[];
}

export class ViralScoreEngine {
  // Mock implementation - in production use trained model on 50M TikTok data
  // For now heuristic based on length, hook keywords, emotion words, question marks

  private viralKeywords = [
    'jangan', 'stop', 'rahasia', 'kesalahan', 'gagal', 'bahaya', 'fatal',
    '90%', '99%', 'semua orang', 'tidak ada yang tahu', 'bocoran'
  ];

  private emotionKeywords = [
    'marah', 'kesal', 'senang', 'sedih', 'kaget', 'takut', 'cinta', 'benci',
    'wow', 'gila', 'parah', 'mantap', 'ngeri'
  ];

  calculate(text: string, duration: number, startTime: number): ViralScoreResult {
    const lower = text.toLowerCase();
    let hookStrength = 20;

    // Hook strength: check first 5 words
    const firstWords = text.split(' ').slice(0, 5).join(' ').toLowerCase();
    for (const kw of this.viralKeywords) {
      if (firstWords.includes(kw) || lower.slice(0, 30).includes(kw)) hookStrength += 15;
    }
    if (text.includes('?')) hookStrength += 10;
    if (text.includes('!')) hookStrength += 5;
    hookStrength = Math.min(95, hookStrength);

    const curiosityGap = lower.includes('kenapa') || lower.includes('bagaimana') || lower.includes('rahasia') ? 85 : 60;
    const controversy = lower.includes('jangan') || lower.includes('stop') || lower.includes('salah') ? 80 : 45;
    const infoDensity = Math.min(90, (text.split(' ').length / duration) * 20 + 40); // words per second
    const emotionalTrigger = this.emotionKeywords.some(k => lower.includes(k)) ? 85 : 50;
    const pacing = duration >= 20 && duration <= 45 ? 90 : duration < 15 ? 60 : 70;

    const viralProbability = Math.round(
      hookStrength * 0.3 + curiosityGap * 0.2 + controversy * 0.15 + infoDensity * 0.15 + emotionalTrigger * 0.1 + pacing * 0.1
    );

    // Retention curve: hook drop, middle stable, end drop if too long
    const retentionCurve = [];
    for (let t = 0; t <= duration; t += 2) {
      let attention = 95;
      if (t < 3) attention = 95 - t * 2; // slight drop after hook
      else if (t < duration * 0.7) attention = 85 + Math.random() * 10;
      else attention = 85 - (t - duration * 0.7) * 2;
      retentionCurve.push({ time: startTime + t, attention: Math.max(30, Math.round(attention)) });
    }

    const reasons = [];
    if (hookStrength > 70) reasons.push('Strong hook in first 3 seconds');
    if (curiosityGap > 75) reasons.push('High curiosity gap');
    if (controversy > 70) reasons.push('Controversial trigger');
    if (infoDensity > 75) reasons.push('High information density');
    if (viralProbability > 80) reasons.push('Viral pattern detected');

    return {
      viralProbability: Math.min(98, viralProbability),
      hookScore: hookStrength,
      retentionScore: Math.round(pacing * 0.6 + infoDensity * 0.4),
      shareabilityScore: Math.round((controversy + curiosityGap) / 2),
      emotionScore: emotionalTrigger,
      breakdown: { hookStrength, curiosityGap, controversy, informationDensity: infoDensity, emotionalTrigger, pacing },
      retentionCurve,
      reasons
    };
  }
}

export const viralScoreEngine = new ViralScoreEngine();
