import type { RawWordEntry } from '../types';

export type Language = 'en' | 'ja';

const PROMPTS: Record<Language, (items: RawWordEntry[]) => string> = {
  en: (items) => `아래 영어 단어와 의미를 보고, 각 단어에 대해 다음을 JSON 배열로 반환해줘.\n- pronunciation: 단어의 한국어 발음 (예: 어밴던)\n- example: 해당 단어를 포함한 자연스러운 영어 예문 1개\n- examplePronunciation: 예문의 한국어 발음\n- exampleTranslation: 예문의 자연스러운 한국어 해석\n\n입력:\n${JSON.stringify(items, null, 2)}\n\n출력 형식 (JSON만, 마크다운 없이):\n[\n {\n  "pronunciation": "어밴던",\n  "example": "She decided to abandon the project.",\n  "examplePronunciation": "쉬 디사이디드 투 어밴던 더 프로젝트",\n  "exampleTranslation": "그녀는 그 프로젝트를 포기하기로 결심했다."\n }\n]`,
  ja: (items) => `아래 일본어 단어와 의미를 보고, 각 단어에 대해 다음을 JSON 배열로 반환해줘.\n- pronunciation: 단어의 한국어 발음 (예: 간바루)\n- example: 해당 단어를 포함한 자연스러운 일본어 예문 1개\n- examplePronunciation: 예문의 한국어 발음\n- exampleTranslation: 예문의 자연스러운 한국어 해석\n\n입력:\n${JSON.stringify(items, null, 2)}\n\n출력 형식 (JSON만, 마크다운 없이):\n[\n {\n  "pronunciation": "간바루",\n  "example": "毎日頑張ることが大切です。",\n  "examplePronunciation": "마이니치 간바루 코토가 타이세츠데스",\n  "exampleTranslation": "매일 열심히 하는 것이 중요합니다."\n }\n]`,
};

export function buildFormattingPrompt(items: RawWordEntry[], language: Language): string {
  return PROMPTS[language](items);
}
