import { describe, it, expect } from 'vitest';
import { selectSdScenario, type GradedScenarioLike } from './sdScenario';
import type { Grade } from '@/content/schema';

const s = (id: string, grade: Grade): GradedScenarioLike => ({ id, grade });
function ident<U>(a: U[]): U[] { return a; } // deterministic "shuffle"

describe('selectSdScenario', () => {
  it('picks a scenario of the requested grade', () => {
    const list = [s('a', 'junior'), s('b', 'senior'), s('c', 'senior')];
    expect(selectSdScenario(list, 'senior', ident)?.grade).toBe('senior');
  });

  it('falls back to any scenario when none match the grade', () => {
    const list = [s('a', 'junior')];
    expect(selectSdScenario(list, 'lead', ident)?.id).toBe('a');
  });

  it('is deterministic given a deterministic shuffle', () => {
    const list = [s('a', 'middle'), s('b', 'middle')];
    expect(selectSdScenario(list, 'middle', ident)).toEqual(selectSdScenario(list, 'middle', ident));
  });

  it('returns undefined for empty input', () => {
    expect(selectSdScenario([], 'junior', ident)).toBeUndefined();
  });
});
