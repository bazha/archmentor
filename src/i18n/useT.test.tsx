import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useT } from './useT';
import { useStore } from '@/store/useStore';

describe('useT', () => {
  beforeEach(() => useStore.getState().setSettings({ lang: 'ru' }));
  it('translates using the current store language', () => {
    const { result, rerender } = renderHook(() => useT());
    expect(result.current('nav.quiz')).toBe('Квиз');
    useStore.getState().setSettings({ lang: 'en' });
    rerender();
    expect(result.current('nav.quiz')).toBe('Quiz');
  });
});
