# Concept Audio (TTS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Listen to concept" audio player to the Library concept page that reads the prose aloud via the browser Web Speech API, highlighting the section being read.

**Architecture:** Three isolated units + one integration. `domain/tts/script.ts` builds an ordered, speakable narration from a localized concept (pure). `domain/tts/speaker.ts` wraps `window.speechSynthesis` (imperative, browser-only). `features/library/useConceptSpeech.ts` is a React hook holding player state. `features/library/AudioPlayer.tsx` renders controls; `ConceptPage.tsx` wires it in with section highlighting.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest + @testing-library/react (jsdom), Zustand store, existing i18n (`useT`/`messages.ts`), Tailwind classes.

## Global Constraints

- **No backend / static hosting (GitHub Pages).** Everything client-side; Web Speech API only, no network calls, no new dependencies.
- **Bilingual RU/EN with compile-time key parity.** `en` is typed `Record<MessageKey, string>` (MessageKey = keyof typeof ru) — every new key MUST be added to BOTH `ru` and `en` blocks in `src/i18n/messages.ts` or `tsc` fails.
- **Read language follows `settings.lang`** from the Zustand store (`useStore((s) => s.settings.lang)`), values `'ru' | 'en'`.
- **Code is NOT read aloud** — replaced by a short spoken note.
- **Graceful degradation:** if `window.speechSynthesis` is unavailable, the player is not rendered; the page works unchanged.
- **Cleanup is mandatory:** speech must stop on unmount, on concept change, and on language change — no "background" voice.
- **a11y:** project is AA-guarded. Controls need `aria-label`s; progress is announced via `aria-live="polite"`.
- **Verification commands:** single test file `npx vitest run <path>`; full suite `npm test`; types `npx tsc --noEmit`.
- **Commit messages:** do NOT include any Claude/Co-Authored-By attribution (project convention).

---

### Task 1: Narration script builder (`domain/tts/script.ts`)

Pure function turning a localized concept into an ordered list of speakable sections. No browser, no React → unit-testable directly.

**Files:**
- Create: `src/domain/tts/script.ts`
- Test: `src/domain/tts/script.test.ts`

**Interfaces:**
- Consumes: `ConceptView` from `@/content/localize` (type-only). Relevant fields: `tagline, definition, problem, solution, codeExample.code, pros[], cons[], tradeoffs[], whenToUse[], whenNotToUse?[]`.
- Produces:
  - `type SpeechSectionId = 'tagline' | 'definition' | 'problem' | 'solution' | 'code' | 'pros' | 'cons' | 'tradeoffs' | 'whenToUse' | 'whenNotToUse'`
  - `interface SpeechSection { id: SpeechSectionId; text: string }`
  - `interface SpeechLabels { definition: string; problem: string; solution: string; code: string; pros: string; cons: string; tradeoffs: string; whenToUse: string; whenNotToUse: string }`
  - `function buildSpeechScript(concept: ConceptView, labels: SpeechLabels): SpeechSection[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/tts/script.test.ts
import { describe, it, expect } from 'vitest';
import { buildSpeechScript, type SpeechLabels } from './script';
import type { ConceptView } from '@/content/localize';

const LABELS: SpeechLabels = {
  definition: 'Определение', problem: 'Проблема', solution: 'Решение',
  code: 'Далее — пример кода.', pros: 'Плюсы', cons: 'Минусы',
  tradeoffs: 'Trade-offs', whenToUse: 'Когда применять', whenNotToUse: 'Когда не стоит',
};

const base: ConceptView = {
  id: 'x', name: 'X', category: 'gof', grade: 'middle',
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/tts/script.test.ts`
Expected: FAIL — `Cannot find module './script'` / `buildSpeechScript is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/tts/script.ts
import type { ConceptView } from '@/content/localize';

export type SpeechSectionId =
  | 'tagline' | 'definition' | 'problem' | 'solution' | 'code'
  | 'pros' | 'cons' | 'tradeoffs' | 'whenToUse' | 'whenNotToUse';

export interface SpeechSection {
  id: SpeechSectionId;
  text: string;
}

export interface SpeechLabels {
  definition: string; problem: string; solution: string; code: string;
  pros: string; cons: string; tradeoffs: string; whenToUse: string; whenNotToUse: string;
}

/** `${label}. ${body}` for prose; list items joined with '. ' as sentence pauses. */
function section(id: SpeechSectionId, label: string, body: string): SpeechSection {
  return { id, text: `${label}. ${body}` };
}

export function buildSpeechScript(c: ConceptView, labels: SpeechLabels): SpeechSection[] {
  const out: SpeechSection[] = [{ id: 'tagline', text: c.tagline }];
  if (c.definition) out.push(section('definition', labels.definition, c.definition));
  if (c.problem) out.push(section('problem', labels.problem, c.problem));
  if (c.solution) out.push(section('solution', labels.solution, c.solution));
  if (c.codeExample.code) out.push({ id: 'code', text: labels.code });
  if (c.pros.length) out.push(section('pros', labels.pros, c.pros.join('. ')));
  if (c.cons.length) out.push(section('cons', labels.cons, c.cons.join('. ')));
  if (c.tradeoffs.length) out.push(section('tradeoffs', labels.tradeoffs, c.tradeoffs.join('. ')));
  if (c.whenToUse.length) out.push(section('whenToUse', labels.whenToUse, c.whenToUse.join('. ')));
  if (c.whenNotToUse?.length) out.push(section('whenNotToUse', labels.whenNotToUse, c.whenNotToUse.join('. ')));
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/tts/script.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/tts/script.ts src/domain/tts/script.test.ts
git commit -m "feat(tts): concept narration script builder"
```

---

### Task 2: Speech engine wrapper (`domain/tts/speaker.ts`)

Thin imperative wrapper over `window.speechSynthesis`. Reads section-by-section (one utterance per section) — this drives highlighting AND sidesteps Chrome's ~15s utterance cutoff.

**Files:**
- Create: `src/domain/tts/speaker.ts`
- Test: `src/domain/tts/speaker.test.ts`

**Interfaces:**
- Consumes: `SpeechSection` from `./script`; `Lang` from `@/i18n/lang`.
- Produces:
  - `function isSpeechSupported(): boolean`
  - `function getVoiceForLang(lang: Lang): SpeechSynthesisVoice | null`
  - `interface SpeakOptions { startIndex?: number; rate: number; voice: SpeechSynthesisVoice | null; onSectionStart: (index: number) => void; onDone: () => void }`
  - `interface SpeechController { pause(): void; resume(): void; stop(): void }`
  - `function speak(sections: SpeechSection[], opts: SpeakOptions): SpeechController`

Note (spec refinement): the player is hidden only when the API is unsupported. A missing locale-matching voice is best-effort — `voice` may be `null` and the browser uses its default voice rather than hiding the player.

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/tts/speaker.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isSpeechSupported, getVoiceForLang, speak } from './speaker';
import type { SpeechSection } from './script';

class FakeUtterance {
  text: string; rate = 1; voice: SpeechSynthesisVoice | null = null;
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
});

describe('speak', () => {
  it('queues one utterance per section, reports absolute start index, applies rate/voice', () => {
    const starts: number[] = [];
    const done = vi.fn();
    speak(secs, { rate: 1.25, voice: getVoiceForLang('ru'), onSectionStart: (i) => starts.push(i), onDone: done });
    expect(synth.cancel).toHaveBeenCalled();
    expect(spoken).toHaveLength(2);
    expect(spoken[0].rate).toBe(1.25);
    expect(spoken[0].voice?.name).toBe('Milena');
    expect(starts).toEqual([0, 1]);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('respects startIndex for resume/jump', () => {
    const starts: number[] = [];
    speak(secs, { startIndex: 1, rate: 1, voice: null, onSectionStart: (i) => starts.push(i), onDone: vi.fn() });
    expect(spoken).toHaveLength(1);
    expect(starts).toEqual([1]);
  });

  it('stop() cancels and suppresses further callbacks', () => {
    const done = vi.fn();
    // speak() runs synchronously in the fake; assert cancel wiring exists
    const ctrl = speak(secs, { rate: 1, voice: null, onSectionStart: vi.fn(), onDone: done });
    ctrl.stop();
    expect(synth.cancel).toHaveBeenCalledTimes(2); // once on speak(), once on stop()
    ctrl.pause(); expect(synth.pause).toHaveBeenCalled();
    ctrl.resume(); expect(synth.resume).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/tts/speaker.test.ts`
Expected: FAIL — `Cannot find module './speaker'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/tts/speaker.ts
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
  onSectionStart: (index: number) => void;
  onDone: () => void;
}

export interface SpeechController {
  pause(): void;
  resume(): void;
  stop(): void;
}

export function speak(sections: SpeechSection[], opts: SpeakOptions): SpeechController {
  const synth = window.speechSynthesis;
  const { startIndex = 0, rate, voice, onSectionStart, onDone } = opts;
  synth.cancel(); // clear any queued/previous speech
  let cancelled = false;

  const queue = sections.slice(startIndex);
  queue.forEach((section, i) => {
    const absoluteIndex = startIndex + i;
    const u = new window.SpeechSynthesisUtterance(section.text);
    u.rate = rate;
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/tts/speaker.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/tts/speaker.ts src/domain/tts/speaker.test.ts
git commit -m "feat(tts): speechSynthesis wrapper with per-section queue"
```

---

### Task 3: Player state hook (`useConceptSpeech`)

React hook owning player state: builds the script from the concept via `useT`, drives the speaker, exposes id-based state for highlighting, and handles cleanup.

**Files:**
- Create: `src/features/library/useConceptSpeech.ts`
- Test: `src/features/library/useConceptSpeech.test.tsx`

**Interfaces:**
- Consumes: `buildSpeechScript`, `SpeechSectionId`, `SpeechLabels` from `@/domain/tts/script`; `isSpeechSupported`, `getVoiceForLang`, `speak`, `SpeechController` from `@/domain/tts/speaker`; `ConceptView` from `@/content/localize`; `useT` from `@/i18n/useT`; `useStore` from `@/store/useStore`.
- Produces:
  - `type SpeechStatus = 'unsupported' | 'idle' | 'playing' | 'paused'`
  - `interface ConceptSpeech { status: SpeechStatus; activeId: SpeechSectionId | null; ordinal: number; total: number; rate: number; play(): void; pause(): void; resume(): void; stop(): void; setRate(rate: number): void; jumpTo(id: SpeechSectionId): void }`
  - `function useConceptSpeech(concept: ConceptView): ConceptSpeech`

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/library/useConceptSpeech.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConceptSpeech } from './useConceptSpeech';
import { useStore } from '@/store/useStore';
import type { ConceptView } from '@/content/localize';

class FakeUtterance {
  text: string; rate = 1; voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}

const concept: ConceptView = {
  id: 'x', name: 'X', category: 'gof', grade: 'middle',
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
    synth = {
      cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(),
      getVoices: () => ([{ lang: 'ru-RU', name: 'Milena' }] as any),
      speak: vi.fn((u: FakeUtterance) => { u.onstart?.(); }), // start only → stays "playing"
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/library/useConceptSpeech.test.tsx`
Expected: FAIL — `Cannot find module './useConceptSpeech'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/library/useConceptSpeech.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildSpeechScript, type SpeechLabels, type SpeechSectionId } from '@/domain/tts/script';
import { isSpeechSupported, getVoiceForLang, speak, type SpeechController } from '@/domain/tts/speaker';
import type { ConceptView } from '@/content/localize';
import { useT } from '@/i18n/useT';
import { useStore } from '@/store/useStore';

export type SpeechStatus = 'unsupported' | 'idle' | 'playing' | 'paused';

export interface ConceptSpeech {
  status: SpeechStatus;
  activeId: SpeechSectionId | null;
  ordinal: number;
  total: number;
  rate: number;
  play(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  jumpTo(id: SpeechSectionId): void;
}

export function useConceptSpeech(concept: ConceptView): ConceptSpeech {
  const lang = useStore((s) => s.settings.lang);
  const t = useT();

  const sections = useMemo(() => {
    const labels: SpeechLabels = {
      definition: t('concept.definition'), problem: t('concept.problem'),
      solution: t('concept.solution'), code: t('concept.audio.codeNote'),
      pros: t('concept.pros'), cons: t('concept.cons'), tradeoffs: t('concept.tradeoffs'),
      whenToUse: t('concept.whenToUse'), whenNotToUse: t('concept.whenNotToUse'),
    };
    return buildSpeechScript(concept, labels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept, lang]);

  const [status, setStatus] = useState<SpeechStatus>(() => (isSpeechSupported() ? 'idle' : 'unsupported'));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [rate, setRateState] = useState(1);
  const ctrlRef = useRef<SpeechController | null>(null);

  const start = useCallback((from: number, rateOverride?: number) => {
    if (!isSpeechSupported() || sections.length === 0) return;
    ctrlRef.current = speak(sections, {
      startIndex: from,
      rate: rateOverride ?? rate,
      voice: getVoiceForLang(lang),
      onSectionStart: (i) => { setActiveIndex(i); setStatus('playing'); },
      onDone: () => { setActiveIndex(null); setStatus('idle'); ctrlRef.current = null; },
    });
    setStatus('playing');
  }, [sections, rate, lang]);

  const play = useCallback(() => start(0), [start]);
  const jumpTo = useCallback((id: SpeechSectionId) => {
    const i = sections.findIndex((s) => s.id === id);
    if (i >= 0) start(i);
  }, [sections, start]);
  const pause = useCallback(() => { ctrlRef.current?.pause(); setStatus('paused'); }, []);
  const resume = useCallback(() => { ctrlRef.current?.resume(); setStatus('playing'); }, []);
  const stop = useCallback(() => {
    ctrlRef.current?.stop(); ctrlRef.current = null;
    setActiveIndex(null); setStatus('idle');
  }, []);
  const setRate = useCallback((r: number) => {
    setRateState(r);
    if (status === 'playing' && activeIndex != null) start(activeIndex, r);
  }, [status, activeIndex, start]);

  // Cleanup on unmount.
  useEffect(() => () => { ctrlRef.current?.stop(); ctrlRef.current = null; }, []);
  // Stop and reset when the concept or language changes (no background voice).
  useEffect(() => {
    ctrlRef.current?.stop(); ctrlRef.current = null;
    setActiveIndex(null);
    setStatus(isSpeechSupported() ? 'idle' : 'unsupported');
  }, [concept.id, lang]);

  return {
    status,
    activeId: activeIndex == null ? null : sections[activeIndex].id,
    ordinal: activeIndex == null ? 0 : activeIndex + 1,
    total: sections.length,
    rate,
    play, pause, resume, stop, setRate, jumpTo,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/library/useConceptSpeech.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/library/useConceptSpeech.ts src/features/library/useConceptSpeech.test.tsx
git commit -m "feat(tts): useConceptSpeech player-state hook"
```

---

### Task 4: i18n keys + player control bar (`AudioPlayer.tsx`)

Add the audio i18n keys and a presentational control bar driven by a `ConceptSpeech` object. Renders nothing when unsupported. Testable in isolation with a hand-built `ConceptSpeech`.

**Files:**
- Modify: `src/i18n/messages.ts` (add keys after `'concept.related'` in BOTH `ru` and `en` blocks)
- Create: `src/features/library/AudioPlayer.tsx`
- Test: `src/features/library/AudioPlayer.test.tsx`

**Interfaces:**
- Consumes: `ConceptSpeech` from `./useConceptSpeech`; `useT` from `@/i18n/useT`.
- Produces: `function AudioPlayer({ speech }: { speech: ConceptSpeech }): JSX.Element | null`
- New message keys: `concept.audio.listen`, `concept.audio.pause`, `concept.audio.resume`, `concept.audio.stop`, `concept.audio.speed`, `concept.audio.progress` (`{n}`,`{m}` vars), `concept.audio.codeNote`.

- [ ] **Step 1: Add i18n keys (both languages)**

In `src/i18n/messages.ts`, add to the `ru` block immediately after the `'concept.related': 'Похожие / путаемые',` line:

```ts
  'concept.audio.listen': 'Слушать',
  'concept.audio.pause': 'Пауза',
  'concept.audio.resume': 'Продолжить',
  'concept.audio.stop': 'Стоп',
  'concept.audio.speed': 'Скорость',
  'concept.audio.progress': 'Секция {n} из {m}',
  'concept.audio.codeNote': 'Далее — пример кода.',
```

And add to the `en` block immediately after the `'concept.related': 'Related / confusable',` line:

```ts
  'concept.audio.listen': 'Listen',
  'concept.audio.pause': 'Pause',
  'concept.audio.resume': 'Resume',
  'concept.audio.stop': 'Stop',
  'concept.audio.speed': 'Speed',
  'concept.audio.progress': 'Section {n} of {m}',
  'concept.audio.codeNote': 'Next, a code example.',
```

- [ ] **Step 2: Verify types still compile (key parity)**

Run: `npx tsc --noEmit`
Expected: PASS (no errors — keys present in both blocks).

- [ ] **Step 3: Write the failing test**

```tsx
// src/features/library/AudioPlayer.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioPlayer } from './AudioPlayer';
import type { ConceptSpeech } from './useConceptSpeech';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().setSettings({ lang: 'ru' }));

function speechStub(over: Partial<ConceptSpeech> = {}): ConceptSpeech {
  return {
    status: 'idle', activeId: null, ordinal: 0, total: 5, rate: 1,
    play: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn(),
    setRate: vi.fn(), jumpTo: vi.fn(), ...over,
  };
}

describe('AudioPlayer', () => {
  it('renders nothing when unsupported', () => {
    const { container } = render(<AudioPlayer speech={speechStub({ status: 'unsupported' })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows Listen when idle and calls play on click', async () => {
    const speech = speechStub();
    render(<AudioPlayer speech={speech} />);
    await userEvent.click(screen.getByRole('button', { name: 'Слушать' }));
    expect(speech.play).toHaveBeenCalled();
  });

  it('shows pause + stop and progress while playing', () => {
    render(<AudioPlayer speech={speechStub({ status: 'playing', ordinal: 2, total: 5 })} />);
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Стоп' })).toBeInTheDocument();
    expect(screen.getByText('Секция 2 из 5')).toBeInTheDocument();
  });

  it('shows resume when paused', () => {
    render(<AudioPlayer speech={speechStub({ status: 'paused', ordinal: 1 })} />);
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeInTheDocument();
  });

  it('changing speed calls setRate', async () => {
    const speech = speechStub();
    render(<AudioPlayer speech={speech} />);
    await userEvent.selectOptions(screen.getByLabelText('Скорость'), '1.5');
    expect(speech.setRate).toHaveBeenCalledWith(1.5);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/features/library/AudioPlayer.test.tsx`
Expected: FAIL — `Cannot find module './AudioPlayer'`.

- [ ] **Step 5: Write the component**

```tsx
// src/features/library/AudioPlayer.tsx
import { useT } from '@/i18n/useT';
import type { ConceptSpeech } from './useConceptSpeech';

const RATES = [0.75, 1, 1.25, 1.5] as const;
const btn =
  'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1.5 text-sm font-medium text-content transition hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function AudioPlayer({ speech }: { speech: ConceptSpeech }): JSX.Element | null {
  const t = useT();
  if (speech.status === 'unsupported') return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('concept.audio.listen')}>
      {speech.status === 'idle' && (
        <button type="button" className={btn} onClick={speech.play}>
          <span aria-hidden="true">▶</span> {t('concept.audio.listen')}
        </button>
      )}
      {speech.status === 'playing' && (
        <button type="button" className={btn} onClick={speech.pause} aria-pressed="true">
          <span aria-hidden="true">⏸</span> {t('concept.audio.pause')}
        </button>
      )}
      {speech.status === 'paused' && (
        <button type="button" className={btn} onClick={speech.resume}>
          <span aria-hidden="true">▶</span> {t('concept.audio.resume')}
        </button>
      )}
      {speech.status !== 'idle' && (
        <button type="button" className={btn} onClick={speech.stop}>
          <span aria-hidden="true">⏹</span> {t('concept.audio.stop')}
        </button>
      )}

      <label className="ml-1 inline-flex items-center gap-1.5 text-sm text-muted">
        {t('concept.audio.speed')}
        <select
          aria-label={t('concept.audio.speed')}
          value={speech.rate}
          onChange={(e) => speech.setRate(Number(e.target.value))}
          className="rounded-md border border-line bg-surface-raised px-2 py-1 text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {RATES.map((r) => (
            <option key={r} value={r}>{r}×</option>
          ))}
        </select>
      </label>

      <span className="text-sm text-muted" aria-live="polite">
        {speech.ordinal > 0 ? t('concept.audio.progress', { n: speech.ordinal, m: speech.total }) : ''}
      </span>
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/features/library/AudioPlayer.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add src/i18n/messages.ts src/features/library/AudioPlayer.tsx src/features/library/AudioPlayer.test.tsx
git commit -m "feat(tts): audio player control bar + i18n keys"
```

---

### Task 5: Wire player into `ConceptPage` with section highlighting

Integrate the hook + player into the concept page: render the control bar in the header, tag readable sections with `data-speech`, highlight the active section, auto-scroll to it, and jump on click.

**Files:**
- Modify: `src/features/library/ConceptPage.tsx` (full updated content below)
- Test: `src/features/library/ConceptPage.audio.test.tsx`

**Interfaces:**
- Consumes: `useConceptSpeech` from `./useConceptSpeech`; `AudioPlayer` from `./AudioPlayer`; `SpeechSectionId` from `@/domain/tts/script`.
- Produces: none (integration only).

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/library/ConceptPage.audio.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { ConceptPage } from './ConceptPage';
import { useStore } from '@/store/useStore';

class FakeUtterance {
  text: string; rate = 1; voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}

function renderPage(path = '/library/strategy') {
  const router = createMemoryRouter(
    [{ path: 'library/:conceptId', element: <ConceptPage /> }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('ConceptPage audio (unsupported)', () => {
  beforeEach(() => useStore.getState().setSettings({ lang: 'ru' }));
  it('does not render the player when API is unavailable', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: 'Слушать' })).not.toBeInTheDocument();
    // page itself still renders
    expect(screen.getByRole('heading', { name: 'Strategy' })).toBeInTheDocument();
  });
});

describe('ConceptPage audio (supported)', () => {
  let synth: any;
  beforeEach(() => {
    useStore.getState().setSettings({ lang: 'ru' });
    (Element.prototype as any).scrollIntoView = vi.fn();
    synth = {
      cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(),
      getVoices: () => ([{ lang: 'ru-RU', name: 'Milena' }] as any),
      speak: vi.fn((u: FakeUtterance) => { u.onstart?.(); }),
    };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows the player and highlights the first section on play', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Слушать' }));
    expect(synth.speak).toHaveBeenCalled();
    // the tagline section is tagged and becomes active
    const tagline = document.querySelector('[data-speech="tagline"]');
    expect(tagline).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeInTheDocument();
  });

  it('readable sections carry data-speech anchors', () => {
    renderPage();
    for (const id of ['tagline', 'definition', 'problem', 'solution', 'pros', 'cons']) {
      expect(document.querySelector(`[data-speech="${id}"]`)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/library/ConceptPage.audio.test.tsx`
Expected: FAIL — player button not found / `data-speech` anchors missing (current page has no audio wiring).

- [ ] **Step 3: Replace `ConceptPage.tsx` with the wired version**

Overwrite `src/features/library/ConceptPage.tsx` with:

```tsx
import { useEffect, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getConcept } from '@/content/index';
import { useConcept } from '@/content/localize';
import { CodeBlock } from '@/components/CodeBlock';
import { ConceptDiagram } from './ConceptDiagram';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';
import { AudioPlayer } from './AudioPlayer';
import { useConceptSpeech, type ConceptSpeech } from './useConceptSpeech';
import type { SpeechSectionId } from '@/domain/tts/script';

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-lg font-bold tracking-tight text-bright">{children}</h2>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

const MARKERS = {
  good: { cls: 'bg-good/15 text-good', sym: '+' },
  bad: { cls: 'bg-bad/15 text-bad', sym: '−' },
} as const;

/** Highlight + anchor props for a readable section, derived from player state. */
function speechProps(speech: ConceptSpeech, id: SpeechSectionId) {
  const active = speech.activeId === id;
  const clickable = speech.status === 'playing' || speech.status === 'paused';
  return {
    'data-speech': id,
    onClick: clickable ? () => speech.jumpTo(id) : undefined,
    className: [
      'space-y-4 scroll-mt-24 rounded-lg transition',
      active ? 'bg-accent/10 ring-1 ring-accent/30 -mx-3 px-3 py-2' : '',
      clickable ? 'cursor-pointer' : '',
    ].filter(Boolean).join(' '),
  };
}

function List({
  title, items, marker, sectionProps,
}: {
  title: string; items: string[]; marker?: 'good' | 'bad';
  sectionProps?: ReturnType<typeof speechProps>;
}) {
  return (
    <section {...(sectionProps ?? { className: 'space-y-4' })}>
      <SectionHeading>{title}</SectionHeading>
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex gap-3 leading-relaxed text-content">
            {marker ? (
              <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md text-sm font-bold ${MARKERS[marker].cls}`} aria-hidden="true">
                {MARKERS[marker].sym}
              </span>
            ) : (
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />
            )}
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ConceptPage() {
  const { conceptId } = useParams();
  const lang = useStore((s) => s.settings.lang);
  const t = useT();
  const c = useConcept(conceptId ?? '');
  const speech = useConceptSpeech(
    c ?? {
      id: '', name: '', category: 'gof', grade: 'junior',
      tagline: '', definition: '', problem: '', solution: '',
      codeExample: { lang: 'typescript', code: '' },
      pros: [], cons: [], tradeoffs: [], whenToUse: [], related: [],
    },
  );

  // Auto-scroll to the section currently being read.
  useEffect(() => {
    if (!speech.activeId) return;
    document.querySelector(`[data-speech="${speech.activeId}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [speech.activeId]);

  if (!c) return <EmptyState icon="🧭" title={t('concept.notFoundTitle')} cta={{ to: '/library', label: t('concept.backToLibrary') }} />;

  return (
    <article className="space-y-8">
      <Link
        to="/library"
        className="inline-flex w-fit items-center rounded text-sm font-medium text-muted transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {t('concept.backToLibrary')}
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="category" category={c.category}>{CATEGORY_LABEL[lang][c.category]}</Badge>
          <Badge tone="grade">{GRADE_LABEL[c.grade]}</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-bright sm:text-4xl">{c.name}</h1>
        <p {...speechProps(speech, 'tagline')} className={`max-w-prose text-lg leading-relaxed text-muted ${speechProps(speech, 'tagline').className}`}>
          {c.tagline}
        </p>
        <AudioPlayer speech={speech} />
      </header>

      <section {...speechProps(speech, 'definition')}>
        <SectionHeading>{t('concept.definition')}</SectionHeading>
        <p className="max-w-prose leading-relaxed text-content">{c.definition}</p>
      </section>

      <section {...speechProps(speech, 'problem')}>
        <SectionHeading>{t('concept.problem')}</SectionHeading>
        <p className="max-w-prose leading-relaxed text-content">{c.problem}</p>
      </section>

      <section {...speechProps(speech, 'solution')}>
        <SectionHeading>{t('concept.solution')}</SectionHeading>
        <p className="max-w-prose leading-relaxed text-content">{c.solution}</p>
      </section>

      {c.diagram && (
        <section className="space-y-4">
          <SectionHeading>{t('concept.diagram')}</SectionHeading>
          <ConceptDiagram source={c.diagram} label={t('concept.diagram')} />
        </section>
      )}

      <section {...speechProps(speech, 'code')}>
        <SectionHeading>{t('concept.codeExample')}</SectionHeading>
        <CodeBlock sample={c.codeExample} />
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <List title={t('concept.pros')} items={c.pros} marker="good" sectionProps={speechProps(speech, 'pros')} />
        <List title={t('concept.cons')} items={c.cons} marker="bad" sectionProps={speechProps(speech, 'cons')} />
      </div>

      <List title={t('concept.tradeoffs')} items={c.tradeoffs} sectionProps={speechProps(speech, 'tradeoffs')} />
      <List title={t('concept.whenToUse')} items={c.whenToUse} sectionProps={speechProps(speech, 'whenToUse')} />
      {c.whenNotToUse && <List title={t('concept.whenNotToUse')} items={c.whenNotToUse} sectionProps={speechProps(speech, 'whenNotToUse')} />}

      {c.related.length > 0 && (
        <section className="space-y-4">
          <SectionHeading>{t('concept.related')}</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {c.related.map((r) => {
              const rc = getConcept(r);
              return (
                <Link
                  key={r}
                  to={`/library/${r}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1 text-sm font-medium text-content shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {rc && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `rgb(var(--cat-${rc.category}))` }} aria-hidden="true" />}
                  {rc?.name ?? r}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
```

Note: `useConceptSpeech` is called unconditionally (before the `if (!c)` early return) with an empty-concept fallback so the hooks order stays stable — React requires hooks to run in the same order every render.

- [ ] **Step 4: Run the audio test to verify it passes**

Run: `npx vitest run src/features/library/ConceptPage.audio.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the existing Library test to confirm no regression**

Run: `npx vitest run src/features/library/Library.test.tsx`
Expected: PASS (existing concept-page assertions still green).

- [ ] **Step 6: Full suite + types**

Run: `npm test`
Expected: PASS (all tests, including the 4 new files).
Run: `npx tsc --noEmit`
Expected: PASS (no type errors).

- [ ] **Step 7: Commit**

```bash
git add src/features/library/ConceptPage.tsx src/features/library/ConceptPage.audio.test.tsx
git commit -m "feat(tts): wire audio player + section highlighting into ConceptPage"
```

---

## Self-Review

**Spec coverage (each spec section → task):**
- §Движок Web Speech / posekционное чтение → Task 2 (`speaker.ts`).
- §Сборка нарратив-скрипта (порядок, пропуск кода, вводные) → Task 1 (`script.ts`).
- §Плеер (play/pause/stop, скорость, «секция N из M») → Task 4 (`AudioPlayer.tsx`).
- §UI и синхронизация (подсветка, авто-скролл, перемотка кликом) → Task 5 (`ConceptPage.tsx` + `speechProps`).
- §Деградация (нет API → плеер скрыт) → Task 2 `isSpeechSupported`, Task 4 early return, Task 5 test.
- §Cleanup (unmount / смена концепта / смена языка) → Task 3 (`useConceptSpeech` effects) + test.
- §Читаемый язык по локали + голос по локали → Task 2 `getVoiceForLang` + Task 3 `lang` dep.
- §i18n ru+en паритет → Task 4 Step 1–2.
- §Тесты (script / speaker / hook / component) → Tasks 1–5 each ship tests.
- §Границы (нет автоплейлиста, нет word-boundary, нет mp3, только Library) → respected; no such code planned.

**Refinement vs spec (noted, consistent):** the spec allowed "hide OR disable" when no locale voice exists. This plan hides the player ONLY when the API itself is unsupported; a missing locale-matching voice falls back to the browser default voice (`getVoiceForLang` → `null` → utterance uses default). Simpler and avoids the async `voiceschanged` race at mount. All tasks/tests reflect this.

**Placeholder scan:** no TBD/TODO; every code step shows complete code; every run step states the exact command + expected result.

**Type consistency:** `SpeechSectionId`/`SpeechSection`/`SpeechLabels` defined in Task 1 are consumed unchanged in Tasks 3 & 5. `SpeakOptions`/`SpeechController`/`speak`/`getVoiceForLang`/`isSpeechSupported` from Task 2 match their use in Task 3. `ConceptSpeech`/`SpeechStatus` from Task 3 match Tasks 4 & 5. `ConceptView` field names (`codeExample.code`, `whenNotToUse?`) match `@/content/localize`. New i18n keys are referenced by the exact strings added in Task 4.

## Execution Handoff

Plan complete. See "Which approach?" prompt from the writing-plans skill.
