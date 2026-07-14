import { describe, it, expect } from 'vitest';
import { messages, translate } from './messages';

describe('messages catalog', () => {
  // Note: ru/en key parity is guaranteed at compile time — `en` is typed
  // `Record<MessageKey, string>` (MessageKey = keyof typeof ru), so a missing or
  // extra key is a tsc error. No runtime parity test needed.
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
