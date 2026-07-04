import { describe, it, expect } from 'vitest';
import { initSrs, review, QUALITY } from './sm2';

describe('SM-2', () => {
  it('initSrs sets defaults due today', () => {
    const s = initSrs('strategy', '2026-07-04');
    expect(s).toEqual({ conceptId: 'strategy', ease: 2.5, interval: 0, repetitions: 0, due: '2026-07-04' });
  });

  it('first successful review sets interval 1 day', () => {
    const s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04');
    expect(s.repetitions).toBe(1);
    expect(s.interval).toBe(1);
    expect(s.due).toBe('2026-07-05');
    expect(s.lastReviewed).toBe('2026-07-04');
  });

  it('second successful review sets interval 6 days', () => {
    let s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04');
    s = review(s, QUALITY.good, '2026-07-05');
    expect(s.repetitions).toBe(2);
    expect(s.interval).toBe(6);
    expect(s.due).toBe('2026-07-11');
  });

  it('third review multiplies interval by ease and rounds', () => {
    let s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04'); // int 1, ease 2.5
    s = review(s, QUALITY.good, '2026-07-05'); // int 6, ease 2.5
    s = review(s, QUALITY.good, '2026-07-11'); // int round(6 * 2.5) = 15
    expect(s.interval).toBe(15);
  });

  it('rep>=3 interval uses PRE-update ease, then ease drops (canonical SM-2)', () => {
    let s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04'); // int 1, ease 2.5
    s = review(s, QUALITY.good, '2026-07-05'); // int 6, ease 2.5
    s = review(s, QUALITY.hard, '2026-07-11'); // int = round(6 * 2.5) = 15 (pre-update ease)
    expect(s.interval).toBe(15);           // NOT round(6 * 2.36) = 14
    expect(s.ease).toBeCloseTo(2.36, 5);   // ease still updated on the returned state
  });

  it('failure (Again) resets repetitions and interval to 1', () => {
    let s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04');
    s = review(s, QUALITY.good, '2026-07-05');
    s = review(s, QUALITY.again, '2026-07-11');
    expect(s.repetitions).toBe(0);
    expect(s.interval).toBe(1);
    expect(s.due).toBe('2026-07-12');
  });

  it('ease never drops below 1.3', () => {
    let s = initSrs('x', '2026-07-04');
    for (let i = 0; i < 10; i++) s = review(s, QUALITY.hard, addISO(i));
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('Easy raises ease above 2.5', () => {
    const s = review(initSrs('x', '2026-07-04'), QUALITY.easy, '2026-07-04');
    expect(s.ease).toBeGreaterThan(2.5);
  });
});

function addISO(i: number): string {
  const d = new Date(Date.UTC(2026, 6, 4) + i * 86400000);
  return d.toISOString().slice(0, 10);
}
