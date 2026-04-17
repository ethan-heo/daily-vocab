import type { DailyWords, WordEntry } from '../types';
import { upsertAllDayCalendarEvent } from '../shared/googleCalendar';

export async function upsertCalendarEvent(words: DailyWords): Promise<void> {
  const calendarId = process.env.CALENDAR_ID;

  if (!calendarId) throw new Error('CALENDAR_ID is required');

  await upsertAllDayCalendarEvent({
    calendarId,
    eventId: `vocab${words.date.replace(/-/g, '')}`,
    summary: `📚 오늘의 단어 (${words.date})`,
    date: words.date,
    attendeeEmail: process.env.ATTENDEE_EMAIL,
    description: buildDescription(words),
  });
}

function buildDescription(words: DailyWords): string {
  const english = words.english.map((entry) => formatEntry(entry)).join('\n\n');
  const japanese = words.japanese.map((entry) => formatEntry(entry)).join('\n\n');

  return [english, '────────────────', japanese].filter(Boolean).join('\n\n');
}

function formatEntry(entry: WordEntry): string {
  return [
    `📌 ${entry.word} (${entry.pronunciation})`,
    `의미: ${entry.meaning}`,
    '',
    `${entry.example}`,
    `${entry.examplePronunciation}`,
    `해석: ${entry.exampleTranslation}`,
  ].join('\n');
}
