import type { RawWordEntry } from '../types';

export type Language = 'en' | 'ja';

const PROMPTS: Record<Language, (items: RawWordEntry[]) => string> = {
  en: (items) => `아래 영어 단어와 의미를 보고, 각 단어에 대해 다음을 JSON 배열로 반환해줘.\n- pronunciation: 단어의 한국어 발음 (예: 어밴던)\n- example: 해당 단어를 포함한 자연스러운 영어 예문 1개\n- examplePronunciation: 예문의 한국어 발음\n\n입력:\n${JSON.stringify(items, null, 2)}\n\n출력 형식 (JSON만, 마크다운 없이):\n[{ "pronunciation": "...", "example": "...", "examplePronunciation": "..." }]`,
  ja: (items) => `아래 일본어 단어와 의미를 보고, 각 단어에 대해 다음을 JSON 배열로 반환해줘.\n- pronunciation: 단어의 한국어 발음 (예: 간바루)\n- example: 해당 단어를 포함한 자연스러운 일본어 예문 1개\n- examplePronunciation: 예문의 한국어 발음\n\n입력:\n${JSON.stringify(items, null, 2)}\n\n출력 형식 (JSON만, 마크다운 없이):\n[{ "pronunciation": "...", "example": "...", "examplePronunciation": "..." }]`,
};

export function buildFormattingPrompt(items: RawWordEntry[], language: Language): string {
  return PROMPTS[language](items);
}
