import { google } from 'googleapis';
import { getNextDateInSeoul } from './date';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export interface AllDayCalendarEventInput {
  calendarId: string;
  eventId: string;
  summary: string;
  date: string;
  description: string;
  attendeeEmail?: string;
}

export async function upsertAllDayCalendarEvent(input: AllDayCalendarEventInput): Promise<void> {
  const calendar = createCalendarClient();
  const event = {
    summary: input.summary,
    start: { date: input.date },
    end: { date: getNextDateInSeoul(input.date) },
    attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : undefined,
    description: input.description,
  };

  try {
    await calendar.events.patch({
      calendarId: input.calendarId,
      eventId: input.eventId,
      requestBody: event,
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 404) throw error;

    await calendar.events.insert({
      calendarId: input.calendarId,
      requestBody: {
        id: input.eventId,
        ...event,
      },
    });
  }
}

function createCalendarClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  if (!keyJson && !keyFile) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_JSON or GOOGLE_SERVICE_ACCOUNT_KEY_PATH is required');
  }

  const auth = new google.auth.GoogleAuth(
    keyJson
      ? { credentials: JSON.parse(keyJson) as object, scopes: SCOPES }
      : { keyFile, scopes: SCOPES },
  );

  return google.calendar({ version: 'v3', auth });
}
