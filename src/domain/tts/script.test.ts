import { describe, it, expect } from 'vitest';
import { buildSpeechScript, type SpeechLabels } from './script';
import type { ConceptView } from '@/content/localize';

const LABELS: SpeechLabels = {
  definition: 'Определение', problem: 'Проблема', solution: 'Решение',
  code: 'Далее — пример кода.', pros: 'Плюсы', cons: 'Минусы',
  tradeoffs: 'Trade-offs', whenToUse: 'Когда применять', whenNotToUse: 'Когда не стоит',
};

const base: ConceptView = {
  id: 'x', name: 'X', category: 'architecture', grade: 'middle',
  tagline: 'Кратко', definition: 'Опр', problem: 'Проб', solution: 'Реш',
  codeExample: { lang: 'typescript', code: 'const a = 1;' },
  pros: ['п1', 'п2'], cons: ['м1'], tradeoffs: ['т1'], whenToUse: ['к1'],
  related: [],
};

describe('buildSpeechScript', () => {
  it('orders sections and prefixes labels', () => {
    const s = buildSpeechScript(base, LABELS);
    expect(s.map((x) => x.id)).toEqual([
      'tagline', 'definition', 'problem', 'solution', 'code',
      'pros', 'cons', 'tradeoffs', 'whenToUse',
    ]);
    expect(s[0].text).toBe('Кратко');
    expect(s[1].text).toBe('Определение. Опр');
    expect(s.find((x) => x.id === 'pros')!.text).toBe('Плюсы. п1. п2');
  });

  it('uses the spoken code note and never includes the code itself', () => {
    const s = buildSpeechScript(base, LABELS);
    const code = s.find((x) => x.id === 'code')!;
    expect(code.text).toBe('Далее — пример кода.');
    expect(s.every((x) => !x.text.includes('const a = 1;'))).toBe(true);
  });

  it('omits sections whose source field is missing/empty', () => {
    const noCode = { ...base, codeExample: { lang: 'typescript' as const, code: '' } };
    expect(buildSpeechScript(noCode, LABELS).some((x) => x.id === 'code')).toBe(false);
    expect(buildSpeechScript(base, LABELS).some((x) => x.id === 'whenNotToUse')).toBe(false);
    const withNot = { ...base, whenNotToUse: ['н1'] };
    expect(buildSpeechScript(withNot, LABELS).some((x) => x.id === 'whenNotToUse')).toBe(true);
  });
});
