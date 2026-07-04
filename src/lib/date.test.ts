import { describe, it, expect } from 'vitest';
import { todayISO, addDays, daysBetween, isDue } from './date';

describe('date utils', () => {
  it('todayISO formats a given date as YYYY-MM-DD (UTC)', () => {
    expect(todayISO(new Date('2026-07-04T23:30:00Z'))).toBe('2026-07-04');
  });

  it('addDays adds days across month boundary', () => {
    expect(addDays('2026-07-30', 3)).toBe('2026-08-02');
  });

  it('addDays handles zero', () => {
    expect(addDays('2026-07-04', 0)).toBe('2026-07-04');
  });

  it('daysBetween returns whole-day difference', () => {
    expect(daysBetween('2026-07-04', '2026-07-06')).toBe(2);
    expect(daysBetween('2026-07-06', '2026-07-04')).toBe(-2);
  });

  it('isDue is true when due date is today or earlier', () => {
    expect(isDue('2026-07-03', '2026-07-04')).toBe(true);
    expect(isDue('2026-07-04', '2026-07-04')).toBe(true);
    expect(isDue('2026-07-05', '2026-07-04')).toBe(false);
  });
});
