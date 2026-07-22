import type { Lang } from '@/i18n/lang';
import type { SpeechSection } from './script';

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window;
}

export function getVoiceForLang(lang: Lang): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

export interface SpeakOptions {
  startIndex?: number;
  rate: number;
  voice: SpeechSynthesisVoice | null;
  lang: Lang;
  onSectionStart: (index: number) => void;
  onDone: () => void;
}

const BCP47: Record<Lang, string> = { ru: 'ru-RU', en: 'en-US' };

export interface SpeechController {
  pause(): void;
  resume(): void;
  stop(): void;
}

export function speak(sections: SpeechSection[], opts: SpeakOptions): SpeechController {
  const synth = window.speechSynthesis;
  const { startIndex = 0, rate, voice, lang, onSectionStart, onDone } = opts;
  synth.cancel(); // clear any queued/previous speech
  let cancelled = false;

  const queue = sections.slice(startIndex);
  queue.forEach((section, i) => {
    const absoluteIndex = startIndex + i;
    const u = new window.SpeechSynthesisUtterance(section.text);
    u.rate = rate;
    u.lang = BCP47[lang];
    if (voice) u.voice = voice;
    u.onstart = () => { if (!cancelled) onSectionStart(absoluteIndex); };
    if (i === queue.length - 1) {
      u.onend = () => { if (!cancelled) onDone(); };
    }
    synth.speak(u);
  });

  return {
    pause: () => synth.pause(),
    resume: () => synth.resume(),
    stop: () => { cancelled = true; synth.cancel(); },
  };
}
