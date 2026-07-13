import { describe, it, expect } from 'vitest';
import { selectDailyQuestion } from './selection';

const bank = Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` }));

describe('selectDailyQuestion', () => {
  it('is stable for a given date and returns an item from the pool', () => {
    const a = selectDailyQuestion(bank, '2026-07-13');
    const b = selectDailyQuestion(bank, '2026-07-13');
    expect(a).toBe(b);
    expect(bank).toContain(a);
  });

  it('varies across a month of dates (covers more than one question)', () => {
    const picks = Array.from({ length: 28 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return selectDailyQuestion(bank, `2026-07-${day}`)!.id;
    });
    expect(new Set(picks).size).toBeGreaterThan(1); // deterministic hash spreads across days
  });

  it('is deterministic — same date always yields the same pick', () => {
    expect(selectDailyQuestion(bank, '2026-01-01')).toBe(selectDailyQuestion(bank, '2026-01-01'));
    expect(selectDailyQuestion(bank, '2026-12-31')).toBe(selectDailyQuestion(bank, '2026-12-31'));
  });

  it('returns undefined for an empty pool', () => {
    expect(selectDailyQuestion([], '2026-07-13')).toBeUndefined();
  });
});
