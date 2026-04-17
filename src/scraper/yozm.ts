import type { Page } from 'playwright';
import type { NewsItem } from '../types';

const BASE_URL = 'https://yozm.wishket.com';
const LIST_URL = `${BASE_URL}/magazine/list/new/`;
const CONTAINER = '[data-testid="article-column-item--container"]';
const SOURCE = '요즘IT';

export async function scrapeYozm(page: Page): Promise<NewsItem[]> {
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(CONTAINER, { timeout: 30000 });

  const items = await page.locator(CONTAINER).all();
  const results: NewsItem[] = [];

  for (const item of items) {
    const anchor = item.locator('a').first();
    const href = await anchor.getAttribute('href');
    if (!href) continue;

    const heading = item.locator('h1, h2, h3, h4').first();
    const title = (await heading.innerText()).trim();
    if (!title) continue;

    const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    results.push({ title, url, source: SOURCE });
  }

  return results;
}
