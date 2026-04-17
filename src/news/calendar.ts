import { google } from 'googleapis';
import type { NewsItem } from '../types';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export async function upsertNewsEvent(date: string, items: NewsItem[]): Promise<void> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  const calendarId = process.env.NEWS_CALENDAR_ID ?? process.env.CALENDAR_ID;

  if (!keyJson && !keyFile) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_JSON or GOOGLE_SERVICE_ACCOUNT_KEY_PATH is required');
  if (!calendarId) throw new Error('NEWS_CALENDAR_ID or CALENDAR_ID is required');

  const authOptions = keyJson
    ? { credentials: JSON.parse(keyJson) as object, scopes: SCOPES }
    : { keyFile: keyFile!, scopes: SCOPES };

  const auth = new google.auth.GoogleAuth(authOptions);
  const calendar = google.calendar({ version: 'v3', auth });

  // Google Calendar event IDs only allow base32hex chars (0-9, a-v). "news" contains 'w' which is invalid.
  const eventId = `mag${date.replace(/-/g, '')}`;
  const attendeeEmail = process.env.ATTENDEE_EMAIL;

  const event = {
    summary: `📰 오늘의 뉴스 (${date})`,
    start: { date },
    end: { date: getNextDate(date) },
    attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined,
    description: buildDescription(items),
  };

  try {
    await calendar.events.patch({ calendarId, eventId, requestBody: event });
  } catch (error) {
    if ((error as { code?: number }).code !== 404) throw error;

    await calendar.events.insert({
      calendarId,
      requestBody: { id: eventId, ...event },
    });
  }
}

function buildDescription(items: NewsItem[]): string {
  return items
    .map((item) => `[${item.source}] ${item.title}\n${item.url}`)
    .join('\n\n');
}

function getNextDate(date: string): string {
  const next = new Date(`${date}T00:00:00+09:00`);
  next.setDate(next.getDate() + 1);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(next);
}
