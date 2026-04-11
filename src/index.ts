import 'dotenv/config';
import { chromium } from 'playwright';
import { upsertCalendarEvent } from './calendar';
import { generateFormatted } from './formatter';
import { scrapeEnglishWords } from './scraper/english';
import { scrapeJapaneseWords } from './scraper/japanese';

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    const englishRaw = await scrapeEnglishWords(page);
    const japaneseRaw = await scrapeJapaneseWords(page);

    const english = await generateFormatted(englishRaw, 'en');
    const japanese = await generateFormatted(japaneseRaw, 'ja');
    const date = getTodayInSeoul();

    await upsertCalendarEvent({ date, english, japanese });

    console.log(`Done: ${date}, english=${english.length}, japanese=${japanese.length}`);
  } finally {
    await browser.close();
  }
}

function getTodayInSeoul(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
