import { describe, it, expect, vi, afterEach } from 'vitest';
import { detectLang } from './lang';

afterEach(() => vi.unstubAllGlobals());

describe('detectLang', () => {
  it('returns ru for a Russian browser locale', () => {
    vi.stubGlobal('navigator', { language: 'ru-RU' });
    expect(detectLang()).toBe('ru');
  });
  it('returns en for a non-Russian locale', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(detectLang()).toBe('en');
  });
  it('returns en when navigator is unavailable', () => {
    vi.stubGlobal('navigator', undefined);
    expect(detectLang()).toBe('en');
  });
});
