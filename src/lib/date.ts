/** Formats a Date as a UTC 'YYYY-MM-DD' string. Defaults to now (only non-pure call site). */
export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

const MS_PER_DAY = 86_400_000;

function toUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((toUTC(toISO) - toUTC(fromISO)) / MS_PER_DAY);
}

export function isDue(dueISO: string, todayISOValue: string): boolean {
  return toUTC(dueISO) <= toUTC(todayISOValue);
}
