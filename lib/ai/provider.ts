import { AIProvider } from './types';
import { MockAIProvider } from './mock.provider';

let _provider: AIProvider | null = null;

export async function getAIProvider(): Promise<AIProvider> {
  if (_provider) return _provider;
  const name = process.env.AI_PROVIDER || 'mock';
  if (name === 'openai') {
    const { OpenAIProvider } = await import('./openai.provider');
    _provider = new OpenAIProvider();
  } else {
    _provider = new MockAIProvider();
  }
  return _provider;
}
