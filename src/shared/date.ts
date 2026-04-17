const SEOUL_TIME_ZONE = 'Asia/Seoul';

export function getTodayInSeoul(): string {
  return formatDateInSeoul(new Date());
}

export function getNextDateInSeoul(date: string): string {
  const next = new Date(`${date}T00:00:00+09:00`);
  next.setDate(next.getDate() + 1);

  return formatDateInSeoul(next);
}

function formatDateInSeoul(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
