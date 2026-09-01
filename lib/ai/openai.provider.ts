import { AIProvider, HighlightSegment, TranscriptWord } from './types';
import OpenAI from 'openai';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  client: OpenAI;
  constructor() { this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); }

  async transcribe(audioPath: string) {
    // Uses Whisper
    const fs = await import('fs');
    const file = fs.createReadStream(audioPath);
    const res = await this.client.audio.transcriptions.create({
      file, model: 'whisper-1', response_format: 'verbose_json', timestamp_granularities: ['word']
    } as any);
    const words: TranscriptWord[] = (res as any).words?.map((w:any)=> ({ word: w.word, start: w.start, end: w.end, confidence: 0.95 })) || [];
    return { text: (res as any).text || '', words, language: 'id' };
  }

  async detectHighlights(transcriptText: string, words: TranscriptWord[], options: any): Promise<HighlightSegment[]> {
    const prompt = `You are an expert video editor. Analyze transcript and find ${options.clipCount} most viral highlights. Each clip ${options.clipDuration}s. Style: ${options.style}. Return JSON array with start, end (seconds), score 0-100, hookScore, engagementScore, emotionScore, infoScore, storyScore, completenessScore, hook, reason, title, description, hashtags. Transcript:\n${transcriptText.slice(0,8000)}`;

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.7, response_format: { type: 'json_object' }
    });
    try {
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      return parsed.highlights || parsed.clips || [];
    } catch { return []; }
  }

  async generateTitles(hook: string, transcriptSlice: string) {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `Generate 5 viral titles, 5 hooks, description, hashtags for clip with hook: ${hook}. Transcript: ${transcriptSlice.slice(0,1000)}. Return JSON.` }],
      temperature: 0.8, response_format: { type: 'json_object' }
    });
    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      titles: parsed.titles || [], hooks: parsed.hooks || [], description: parsed.description || '', hashtags: parsed.hashtags || []
    };
  }
}
