export interface TranscriptWord { word: string; start: number; end: number; confidence: number; }
export interface HighlightSegment {
  start: number; end: number; score: number;
  hookScore: number; engagementScore: number; emotionScore: number; infoScore: number; storyScore: number; completenessScore: number;
  hook: string; reason: string;
  title?: string; description?: string; hashtags?: string[];
  viralProbability?: number; retentionScore?: number; shareabilityScore?: number;
  viralBreakdown?: any; retentionCurve?: any; hookVariants?: any; autoEffects?: any; ctrPrediction?: number;
}

export interface AIProvider {
  name: string;
  transcribe(audioPath: string): Promise<{ text: string; words: TranscriptWord[]; language: string }>;
  detectHighlights(transcriptText: string, words: TranscriptWord[], options: { clipCount: number; clipDuration: number; style: string; intensity: string }): Promise<HighlightSegment[]>;
  generateTitles(hook: string, transcriptSlice: string): Promise<{ titles: string[]; hooks: string[]; description: string; hashtags: string[]; viralScore?: number; hookVariants?: any[] }>;
}
