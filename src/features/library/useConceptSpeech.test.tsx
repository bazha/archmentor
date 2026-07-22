import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConceptSpeech } from './useConceptSpeech';
import { useStore } from '@/store/useStore';
import type { ConceptView } from '@/content/localize';

class FakeUtterance {
  text: string; rate = 1; voice: unknown = null; lang = '';
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}

const concept: ConceptView = {
  id: 'x', name: 'X', category: 'architecture', grade: 'middle',
  tagline: 'Кратко', definition: 'Опр', problem: 'Проб', solution: 'Реш',
  codeExample: { lang: 'typescript', code: 'const a = 1;' },
  pros: ['п1'], cons: ['м1'], tradeoffs: ['т1'], whenToUse: ['к1'], related: [],
};

describe('useConceptSpeech (unsupported env)', () => {
  it('reports unsupported when API absent (default jsdom)', () => {
    const { result } = renderHook(() => useConceptSpeech(concept));
    expect(result.current.status).toBe('unsupported');
    expect(result.current.total).toBeGreaterThan(0);
  });
});

describe('useConceptSpeech (supported env)', () => {
  let synth: any;
  beforeEach(() => {
    useStore.getState().setSettings({ lang: 'ru' });
    // Models serial playback: only the first utterance queued after each
    // cancel() fires onstart (no onend), so the hook's activeIndex stays on
    // the first section — matching real speechSynthesis, which plays its
    // queue one at a time (see speaker.test.ts's own fake for the same idea).
    let started = false;
    synth = {
      cancel: vi.fn(() => { started = false; }), pause: vi.fn(), resume: vi.fn(),
      getVoices: () => ([{ lang: 'ru-RU', name: 'Milena' }] as any),
      speak: vi.fn((u: FakeUtterance) => { if (!started) { started = true; u.onstart?.(); } }),
    };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('play() starts and marks the first section active', () => {
    const { result } = renderHook(() => useConceptSpeech(concept));
    expect(result.current.status).toBe('idle');
    act(() => result.current.play());
    expect(result.current.status).toBe('playing');
    expect(result.current.activeId).toBe('tagline');
    expect(result.current.ordinal).toBe(1);
  });

  it('stop() resets and cancels', () => {
    const { result } = renderHook(() => useConceptSpeech(concept));
    act(() => result.current.play());
    act(() => result.current.stop());
    expect(result.current.status).toBe('idle');
    expect(result.current.activeId).toBeNull();
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('stops speech on unmount', () => {
    const { result, unmount } = renderHook(() => useConceptSpeech(concept));
    act(() => result.current.play());
    synth.cancel.mockClear();
    unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });
});
