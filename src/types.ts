export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
}

export interface RawWordEntry {
  word: string;
  meaning: string;
}

export interface WordEntry {
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
  examplePronunciation: string;
}

export interface DailyWords {
  date: string;
  english: WordEntry[];
  japanese: WordEntry[];
}
