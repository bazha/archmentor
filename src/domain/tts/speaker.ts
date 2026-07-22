import type { Lang } from '@/i18n/lang';
import type { SpeechSection } from './script';

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window;
}

// Higher score = more natural-sounding. Network voices (localService === false,
// e.g. Chrome's "Google" voices) are markedly less robotic than the local
// synthesizers; named "enhanced"/"premium"/"neural"/"siri" voices are the good
// local ones (macOS), and "compact"/"eSpeak" are the robotic defaults to avoid.
const GOOD_VOICE = /google|natural|premium|enhanced|neural|siri/i;
const POOR_VOICE = /compact|espeak/i;

function scoreVoice(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (!v.localService) s += 100; // network voice — biggest quality win
  if (GOOD_VOICE.test(v.name)) s += 10;
  if (POOR_VOICE.test(v.name)) s -= 50;
  return s;
}

export function getVoiceForLang(lang: Lang): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const matches = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang));
  if (matches.length === 0) return null;
  // Pick the highest-scoring voice; ties keep the first (platform) order.
  return matches.reduce((best, v) => (scoreVoice(v) > scoreVoice(best) ? v : best));
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
