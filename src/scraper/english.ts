import type { Page } from 'playwright';
import type { RawWordEntry } from '../types';

const URL = 'https://search.naver.com/search.naver?where=nexearch&query=%EC%98%A4%EB%8A%98%EC%9D%98+%EC%98%81%EB%8B%A8%EC%96%B4';
const CONTAINER = '.sc_new.cs_dicstudy._fe_language_study';

export async function scrapeEnglishWords(page: Page): Promise<RawWordEntry[]> {
  return scrapeWords(page, URL);
}

async function scrapeWords(page: Page, url: string): Promise<RawWordEntry[]> {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector(CONTAINER, { timeout: 15000 });

  const words = await page.locator(`${CONTAINER} .word`).allInnerTexts();
  const meanings = await page.locator(`${CONTAINER} .mean`).allInnerTexts();

  return words
    .map((word, index) => ({
      word: word.trim(),
      meaning: (meanings[index] || '').trim(),
    }))
    .filter((entry) => entry.word && entry.meaning);
}
