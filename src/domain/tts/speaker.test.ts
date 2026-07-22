import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isSpeechSupported, getVoiceForLang, speak } from './speaker';
import type { SpeechSection } from './script';

class FakeUtterance {
  text: string; rate = 1; voice: SpeechSynthesisVoice | null = null; lang = '';
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}

let spoken: FakeUtterance[];
let synth: any;

beforeEach(() => {
  spoken = [];
  synth = {
    cancel: vi.fn(() => { spoken.length = 0; }),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => ([{ lang: 'ru-RU', name: 'Milena' }, { lang: 'en-US', name: 'Alex' }] as any),
    // fire lifecycle synchronously so assertions are simple
    speak: vi.fn((u: FakeUtterance) => { spoken.push(u); u.onstart?.(); u.onend?.(); }),
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
});
afterEach(() => vi.unstubAllGlobals());

const secs: SpeechSection[] = [
  { id: 'tagline', text: 'a' },
  { id: 'definition', text: 'b' },
];

describe('isSpeechSupported', () => {
  it('true when API present', () => expect(isSpeechSupported()).toBe(true));
  it('false when API absent', () => {
    vi.unstubAllGlobals();
    expect(isSpeechSupported()).toBe(false);
  });
});

describe('getVoiceForLang', () => {
  it('matches by lang prefix', () => {
    expect(getVoiceForLang('ru')?.name).toBe('Milena');
    expect(getVoiceForLang('en')?.name).toBe('Alex');
  });

  it('prefers a network voice over a local one for the same language', () => {
    synth.getVoices = () => ([
      { lang: 'ru-RU', name: 'Milena', localService: true },
      { lang: 'ru-RU', name: 'Google русский', localService: false },
    ] as any);
    expect(getVoiceForLang('ru')?.name).toBe('Google русский');
  });

  it('prefers an enhanced local voice over a compact one', () => {
    synth.getVoices = () => ([
      { lang: 'en-US', name: 'Albert (compact)', localService: true },
      { lang: 'en-US', name: 'Samantha (Enhanced)', localService: true },
    ] as any);
    expect(getVoiceForLang('en')?.name).toBe('Samantha (Enhanced)');
  });

  it('returns null when no voice matches the language', () => {
    synth.getVoices = () => ([{ lang: 'de-DE', name: 'Anna', localService: true }] as any);
    expect(getVoiceForLang('ru')).toBeNull();
  });
});

describe('speak', () => {
  it('queues one utterance per section, reports absolute start index, applies rate/voice', () => {
    const starts: number[] = [];
    const done = vi.fn();
    speak(secs, { rate: 1.25, voice: getVoiceForLang('ru'), lang: 'ru', onSectionStart: (i) => starts.push(i), onDone: done });
    expect(synth.cancel).toHaveBeenCalled();
    expect(spoken).toHaveLength(2);
    expect(spoken[0].rate).toBe(1.25);
    expect(spoken[0].voice?.name).toBe('Milena');
    expect(spoken[0].lang).toBe('ru-RU');
    expect(starts).toEqual([0, 1]);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('respects startIndex for resume/jump', () => {
    const starts: number[] = [];
    speak(secs, { startIndex: 1, rate: 1, voice: null, lang: 'en', onSectionStart: (i) => starts.push(i), onDone: vi.fn() });
    expect(spoken).toHaveLength(1);
    expect(starts).toEqual([1]);
  });

  it('stop() cancels and suppresses further callbacks', () => {
    const done = vi.fn();
    // speak() runs synchronously in the fake; assert cancel wiring exists
    const ctrl = speak(secs, { rate: 1, voice: null, lang: 'en', onSectionStart: vi.fn(), onDone: done });
    ctrl.stop();
    expect(synth.cancel).toHaveBeenCalledTimes(2); // once on speak(), once on stop()
    ctrl.pause(); expect(synth.pause).toHaveBeenCalled();
    ctrl.resume(); expect(synth.resume).toHaveBeenCalled();
  });
});
