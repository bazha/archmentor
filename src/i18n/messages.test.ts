import { describe, it, expect } from 'vitest';
import { messages, translate } from './messages';

describe('messages catalog', () => {
  it('has identical key sets for ru and en', () => {
    const ru = Object.keys(messages.ru).sort();
    const en = Object.keys(messages.en).sort();
    expect(en).toEqual(ru);
  });
  it('has no empty strings', () => {
    for (const lang of ['ru', 'en'] as const)
      for (const [k, v] of Object.entries(messages[lang]))
        expect(v, `${lang}.${k}`).not.toBe('');
  });
});

describe('translate', () => {
  it('returns the string for the language', () => {
    expect(translate('en', 'nav.dashboard')).toBe('Dashboard');
    expect(translate('ru', 'nav.dashboard')).toBe('Дашборд');
  });
  it('interpolates {vars}', () => {
    expect(translate('en', 'common.counter', { index: 2, total: 5 })).toBe('2 / 5');
  });
});
