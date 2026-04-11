import type { RawWordEntry, WordEntry } from '../types';

type Language = 'en' | 'ja';

interface ClaudeFormattedEntry {
  pronunciation: string;
  example: string;
  examplePronunciation: string;
}

const PROMPTS: Record<Language, (items: RawWordEntry[]) => string> = {
  en: (items) => `아래 영어 단어와 의미를 보고, 각 단어에 대해 다음을 JSON 배열로 반환해줘.\n- pronunciation: 단어의 한국어 발음 (예: 어밴던)\n- example: 해당 단어를 포함한 자연스러운 영어 예문 1개\n- examplePronunciation: 예문의 한국어 발음\n\n입력:\n${JSON.stringify(items, null, 2)}\n\n출력 형식 (JSON만, 마크다운 없이):\n[{ "pronunciation": "...", "example": "...", "examplePronunciation": "..." }]`,
  ja: (items) => `아래 일본어 단어와 의미를 보고, 각 단어에 대해 다음을 JSON 배열로 반환해줘.\n- pronunciation: 단어의 한국어 발음 (예: 간바루)\n- example: 해당 단어를 포함한 자연스러운 일본어 예문 1개\n- examplePronunciation: 예문의 한국어 발음\n\n입력:\n${JSON.stringify(items, null, 2)}\n\n출력 형식 (JSON만, 마크다운 없이):\n[{ "pronunciation": "...", "example": "...", "examplePronunciation": "..." }]`,
};

export async function generateFormatted(items: RawWordEntry[], language: Language): Promise<WordEntry[]> {
  if (items.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2000,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: PROMPTS[language](items),
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = data.content?.find((item) => item.type === 'text')?.text?.trim();
  if (!text) {
    throw new Error('Anthropic response did not contain text content');
  }

  const parsed = JSON.parse(extractJson(text)) as ClaudeFormattedEntry[];

  if (parsed.length !== items.length) {
    throw new Error(`Anthropic response length mismatch: expected ${items.length}, got ${parsed.length}`);
  }

  return items.map((item, index) => ({
    ...item,
    pronunciation: parsed[index]?.pronunciation?.trim() || '',
    example: parsed[index]?.example?.trim() || '',
    examplePronunciation: parsed[index]?.examplePronunciation?.trim() || '',
  }));
}

function extractJson(text: string): string {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');

  if (start === -1 || end === -1 || end < start) {
    throw new Error('Could not find JSON array in Anthropic response');
  }

  return text.slice(start, end + 1);
}
