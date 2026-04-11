import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { RawWordEntry, WordEntry } from '../types';

const execFileAsync = promisify(execFile);

type Language = 'en' | 'ja';

interface OpenClawFormattedEntry {
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

  const raw = await runOpenClawPrompt(PROMPTS[language](items));
  const parsed = JSON.parse(extractJson(raw)) as OpenClawFormattedEntry[];

  if (parsed.length !== items.length) {
    throw new Error(`OpenClaw response length mismatch: expected ${items.length}, got ${parsed.length}`);
  }

  return items.map((item, index) => ({
    ...item,
    pronunciation: parsed[index]?.pronunciation?.trim() || '',
    example: parsed[index]?.example?.trim() || '',
    examplePronunciation: parsed[index]?.examplePronunciation?.trim() || '',
  }));
}

async function runOpenClawPrompt(prompt: string): Promise<string> {
  const bin = process.env.OPENCLAW_BIN || 'openclaw';
  const args = ['run', '--print', prompt];

  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      maxBuffer: 1024 * 1024 * 4,
      env: process.env,
    });

    const output = `${stdout}`.trim() || `${stderr}`.trim();
    if (!output) {
      throw new Error('OpenClaw returned empty output');
    }

    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenClaw generation failed: ${message}`);
  }
}

function extractJson(text: string): string {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');

  if (start === -1 || end === -1 || end < start) {
    throw new Error('Could not find JSON array in OpenClaw response');
  }

  return text.slice(start, end + 1);
}
