import type { RawWordEntry, WordEntry } from '../types';
import type { Language } from './prompt';
import { buildFormattingPrompt } from './prompt';

interface OpenClawFormattedEntry {
  pronunciation: string;
  example: string;
  examplePronunciation: string;
}

export async function generateFormatted(items: RawWordEntry[], language: Language): Promise<WordEntry[]> {
  throw new Error(
    `generateFormatted() is not available inside the standalone Node process. Use buildFormattingPrompt() and let OpenClaw generate the JSON with its active provider, then pass the parsed result into mergeFormattedEntries(). Prompt preview: ${buildFormattingPrompt(items, language).slice(0, 120)}...`
  );
}

export function mergeFormattedEntries(items: RawWordEntry[], formatted: OpenClawFormattedEntry[]): WordEntry[] {
  if (formatted.length !== items.length) {
    throw new Error(`Formatted response length mismatch: expected ${items.length}, got ${formatted.length}`);
  }

  return items.map((item, index) => ({
    ...item,
    pronunciation: formatted[index]?.pronunciation?.trim() || '',
    example: formatted[index]?.example?.trim() || '',
    examplePronunciation: formatted[index]?.examplePronunciation?.trim() || '',
  }));
}

export function extractJsonArray(text: string): string {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');

  if (start === -1 || end === -1 || end < start) {
    throw new Error('Could not find JSON array in generated response');
  }

  return text.slice(start, end + 1);
}
