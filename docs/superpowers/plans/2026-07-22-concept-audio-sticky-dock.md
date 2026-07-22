# Sticky Audio Mini-Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the inline audio player scrolls out of view during active narration, show a fixed bottom mini-player with the same controls; hide it on scroll-up or stop.

**Architecture:** A generic `useInView` hook (IntersectionObserver) reports whether the inline player is on screen. `AudioDock` is a fixed bottom bar that re-renders the existing `AudioPlayer` bound to the same `speech` state. `ConceptPage` wires them: `docked = !inView && (status is playing|paused)`, and marks the inline player `aria-hidden` while docked so screen readers see one control set.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest + @testing-library/react (jsdom), Tailwind classes.

## Global Constraints

- No new dependencies; fully client-side.
- Reuse the existing `AudioPlayer` and the single `useConceptSpeech`/`ConceptSpeech` state — do NOT add new playback state or a second player.
- Do NOT modify TTS logic: `src/domain/tts/*`, `src/features/library/useConceptSpeech.ts`, and the controls inside `src/features/library/AudioPlayer.tsx` stay unchanged.
- Dock appears only when `!inView && (speech.status === 'playing' || speech.status === 'paused')`.
- Graceful degradation: no `IntersectionObserver` → `inView` stays `true` → dock never shows.
- a11y (AA-guarded app): while docked, the inline player wrapper is `aria-hidden`; the dock respects `prefers-reduced-motion`; hidden dock is removed from the tab order / a11y tree (`invisible`).
- Desktop alignment: the bottom bar pads its content under the sidebar — sidebar width is `15.5rem` (from `Layout`'s `md:grid-cols-[15.5rem_1fr]`); horizontal padding matches `main` (`px-4 md:px-8`). Bar uses `z-40` (same as the top header; they occupy opposite edges).
- Verification: single test file `npx vitest run <path>`; full suite `npm test`; types `npx tsc --noEmit`.
- Commit messages contain no Claude/Co-Authored-By/"Generated with" attribution.

---

### Task 1: `useInView` hook (IntersectionObserver)

Generic visibility hook — returns a `ref` to attach and a boolean `inView`. No audio coupling.

**Files:**
- Create: `src/features/library/useInView.ts`
- Test: `src/features/library/useInView.test.tsx`

**Interfaces:**
- Consumes: React (`useEffect`, `useRef`, `useState`, `RefObject`).
- Produces: `function useInView<T extends Element>(): { ref: RefObject<T>; inView: boolean }`

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/library/useInView.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useInView } from './useInView';

let ioCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | null;
const observe = vi.fn();
const disconnect = vi.fn();

function stubIO() {
  ioCallback = null;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) { ioCallback = cb; }
    observe = observe;
    unobserve = vi.fn();
    disconnect = disconnect;
    takeRecords = () => [];
    root = null; rootMargin = ''; thresholds = [];
  });
}

function Harness() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return <div ref={ref} data-testid="target" data-inview={String(inView)} />;
}

describe('useInView', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('defaults to inView=true and observes the element', () => {
    stubIO();
    observe.mockClear();
    render(<Harness />);
    expect(screen.getByTestId('target')).toHaveAttribute('data-inview', 'true');
    expect(observe).toHaveBeenCalledTimes(1);
  });

  it('updates inView when the observer reports intersection changes', () => {
    stubIO();
    render(<Harness />);
    act(() => ioCallback!([{ isIntersecting: false }]));
    expect(screen.getByTestId('target')).toHaveAttribute('data-inview', 'false');
    act(() => ioCallback!([{ isIntersecting: true }]));
    expect(screen.getByTestId('target')).toHaveAttribute('data-inview', 'true');
  });

  it('disconnects on unmount', () => {
    stubIO();
    disconnect.mockClear();
    const { unmount } = render(<Harness />);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('stays inView=true when IntersectionObserver is unavailable', () => {
    // no stub — jsdom has no IntersectionObserver
    expect(() => render(<Harness />)).not.toThrow();
    expect(screen.getByTestId('target')).toHaveAttribute('data-inview', 'true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/library/useInView.test.tsx`
Expected: FAIL — `Cannot find module './useInView'`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/features/library/useInView.ts
import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Reports whether the referenced element is currently in the viewport.
 * Safe default `inView: true` (dock stays hidden) before the observer fires
 * or when IntersectionObserver is unavailable.
 */
export function useInView<T extends Element>(): { ref: RefObject<T>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/library/useInView.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/library/useInView.ts src/features/library/useInView.test.tsx
git commit -m "feat(tts): useInView IntersectionObserver hook"
```

---

### Task 2: `AudioDock` fixed bottom mini-player

Presentational fixed bottom bar that re-renders the existing `AudioPlayer`. Visibility driven by a `visible` prop; hidden state is off-screen, non-interactive, and out of the a11y tree.

**Files:**
- Create: `src/features/library/AudioDock.tsx`
- Test: `src/features/library/AudioDock.test.tsx`

**Interfaces:**
- Consumes: `AudioPlayer` from `./AudioPlayer`; `ConceptSpeech` from `./useConceptSpeech`.
- Produces: `function AudioDock({ speech, visible }: { speech: ConceptSpeech; visible: boolean }): JSX.Element | null`

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/library/AudioDock.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudioDock } from './AudioDock';
import type { ConceptSpeech } from './useConceptSpeech';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().setSettings({ lang: 'ru' }));

function speechStub(over: Partial<ConceptSpeech> = {}): ConceptSpeech {
  return {
    status: 'playing', activeId: 'tagline', ordinal: 1, total: 5, rate: 1,
    play: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn(),
    setRate: vi.fn(), jumpTo: vi.fn(), ...over,
  };
}

describe('AudioDock', () => {
  it('renders nothing when speech is unsupported', () => {
    render(<AudioDock speech={speechStub({ status: 'unsupported' })} visible={true} />);
    expect(screen.queryByTestId('audio-dock')).not.toBeInTheDocument();
  });

  it('when visible, shows the controls and is not aria-hidden', () => {
    render(<AudioDock speech={speechStub({ status: 'playing' })} visible={true} />);
    const dock = screen.getByTestId('audio-dock');
    expect(dock).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeInTheDocument();
  });

  it('when hidden, is aria-hidden and its controls are out of the a11y tree', () => {
    render(<AudioDock speech={speechStub({ status: 'playing' })} visible={false} />);
    const dock = screen.getByTestId('audio-dock');
    expect(dock).toHaveAttribute('aria-hidden', 'true');
    // getByRole ignores aria-hidden subtrees → the control is not accessible
    expect(screen.queryByRole('button', { name: 'Пауза' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/library/AudioDock.test.tsx`
Expected: FAIL — `Cannot find module './AudioDock'`.

- [ ] **Step 3: Write the component**

```tsx
// src/features/library/AudioDock.tsx
import { AudioPlayer } from './AudioPlayer';
import type { ConceptSpeech } from './useConceptSpeech';

export function AudioDock({ speech, visible }: { speech: ConceptSpeech; visible: boolean }): JSX.Element | null {
  if (speech.status === 'unsupported') return null;

  return (
    <div
      data-testid="audio-dock"
      aria-hidden={!visible || undefined}
      className={[
        'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/80 px-4 py-3 backdrop-blur-xl',
        'transition-transform duration-200 motion-reduce:transition-none md:px-8 md:pl-[15.5rem]',
        visible ? 'translate-y-0' : 'invisible translate-y-full',
      ].join(' ')}
    >
      <AudioPlayer speech={speech} />
    </div>
  );
}
```

Note: `invisible` (visibility:hidden) removes the hidden bar from the tab order and a11y tree, while `transition-transform` animates the slide-in on appear; `motion-reduce:transition-none` honors reduced-motion. The bar reuses `AudioPlayer` verbatim — no control changes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/library/AudioDock.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/library/AudioDock.tsx src/features/library/AudioDock.test.tsx
git commit -m "feat(tts): AudioDock fixed bottom mini-player"
```

---

### Task 3: Wire the dock into `ConceptPage`

Attach `useInView` to the inline player wrapper, compute `docked`, render `AudioDock`, and mark the inline player `aria-hidden` while docked.

**Files:**
- Modify: `src/features/library/ConceptPage.tsx`
- Test: `src/features/library/ConceptPage.dock.test.tsx`

**Interfaces:**
- Consumes: `useInView` from `./useInView`; `AudioDock` from `./AudioDock`.
- Produces: none (integration only).

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/library/ConceptPage.dock.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { ConceptPage } from './ConceptPage';
import { useStore } from '@/store/useStore';

class FakeUtterance {
  text: string; rate = 1; lang = ''; voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}

let ioCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | null;

function renderPage(path = '/library/strategy') {
  const router = createMemoryRouter(
    [{ path: 'library/:conceptId', element: <ConceptPage /> }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('ConceptPage sticky dock', () => {
  let synth: any;
  beforeEach(() => {
    useStore.getState().setSettings({ lang: 'ru' });
    (Element.prototype as any).scrollIntoView = vi.fn();
    ioCallback = null;
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: (e: Array<{ isIntersecting: boolean }>) => void) { ioCallback = cb; }
      observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn();
      takeRecords = () => []; root = null; rootMargin = ''; thresholds = [];
    });
    synth = {
      cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(),
      getVoices: () => ([{ lang: 'ru-RU', name: 'Milena', localService: true }] as any),
      speak: vi.fn((u: FakeUtterance) => { u.onstart?.(); }),
    };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('dock is hidden while inline player is in view, shows when it scrolls out during playback', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Слушать' }));
    // playing, inline still in view (default) → dock hidden
    expect(screen.getByTestId('audio-dock')).toHaveAttribute('aria-hidden', 'true');

    // inline player scrolls out of view → dock shows
    act(() => ioCallback!([{ isIntersecting: false }]));
    expect(screen.getByTestId('audio-dock')).not.toHaveAttribute('aria-hidden');
    // inline player wrapper becomes aria-hidden so SRs see one control set
    expect(screen.getByTestId('inline-audio')).toHaveAttribute('aria-hidden', 'true');

    // scroll back into view → dock hides again
    act(() => ioCallback!([{ isIntersecting: true }]));
    expect(screen.getByTestId('audio-dock')).toHaveAttribute('aria-hidden', 'true');
  });

  it('dock stays hidden when out of view but not playing (idle)', () => {
    renderPage();
    act(() => ioCallback!([{ isIntersecting: false }]));
    // never played → status idle → dock hidden even though out of view
    expect(screen.getByTestId('audio-dock')).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/library/ConceptPage.dock.test.tsx`
Expected: FAIL — no `audio-dock`/`inline-audio` test ids (dock not wired yet).

- [ ] **Step 3: Edit `ConceptPage.tsx` — add imports**

At the top of the import block (after the existing `useConceptSpeech` import line `import { useConceptSpeech, type ConceptSpeech } from './useConceptSpeech';`), add:

```tsx
import { AudioDock } from './AudioDock';
import { useInView } from './useInView';
```

- [ ] **Step 4: Edit `ConceptPage.tsx` — call `useInView` with the other hooks**

Immediately after the `const speech = useConceptSpeech(...)` block (the `);` on the line before the auto-scroll `useEffect`), add:

```tsx
  const { ref: playerRef, inView } = useInView<HTMLDivElement>();
```

- [ ] **Step 5: Edit `ConceptPage.tsx` — wrap the inline player and compute `docked`**

Replace the current inline player line inside the `<header>`:

```tsx
        <AudioPlayer speech={speech} />
```

with a wrapper that carries the ref and the docked-state `aria-hidden`:

```tsx
        <div ref={playerRef} data-testid="inline-audio" aria-hidden={docked || undefined}>
          <AudioPlayer speech={speech} />
        </div>
```

Then, directly after the `if (!c) return <EmptyState ... />;` line and before `return (`, add the `docked` computation:

```tsx
  const docked = !inView && (speech.status === 'playing' || speech.status === 'paused');
```

- [ ] **Step 6: Edit `ConceptPage.tsx` — render the dock**

Immediately before the closing `</article>` tag (after the related-concepts block), add:

```tsx
      <AudioDock speech={speech} visible={docked} />
```

- [ ] **Step 7: Run the dock test to verify it passes**

Run: `npx vitest run src/features/library/ConceptPage.dock.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 8: Run existing ConceptPage/Library tests for no regression**

Run: `npx vitest run src/features/library/ConceptPage.audio.test.tsx src/features/library/Library.test.tsx`
Expected: PASS (existing assertions still green).

- [ ] **Step 9: Full suite + types**

Run: `npm test`
Expected: PASS (all tests, including the 3 new files).
Run: `npx tsc --noEmit`
Expected: PASS (no type errors).

- [ ] **Step 10: Commit**

```bash
git add src/features/library/ConceptPage.tsx src/features/library/ConceptPage.dock.test.tsx
git commit -m "feat(tts): wire sticky bottom mini-player into ConceptPage"
```

---

## Self-Review

**Spec coverage (each spec section → task):**
- §Детекция «вне экрана» (IntersectionObserver, safe default, disconnect) → Task 1 (`useInView`).
- §`AudioDock` (fixed bottom, reuse AudioPlayer, slide + reduced-motion, sidebar offset) → Task 2.
- §Триггер `!inView && (playing|paused)` → Task 3 Step 5 (`docked`).
- §Интеграция (ref на обёртку, рендер дока, `aria-hidden` на инлайн) → Task 3 Steps 3–6.
- §a11y (один активный набор контролов; hidden dock out of a11y tree) → Task 2 (`invisible` + `aria-hidden`), Task 3 (inline `aria-hidden`); tests assert both.
- §Границы (TTS не трогаем; только ConceptPage) → no changes to `domain/tts/*`, `useConceptSpeech`, `AudioPlayer` controls.
- §Тесты (useInView / AudioDock / ConceptPage dock) → Tasks 1–3 each ship tests.
- §Edge-cases (no IO → dock never shows; stop/idle hides; concept/lang change stops → hidden) → Task 1 no-API test; Task 3 idle test; `docked` derives from `status`.

**Hook-order note:** `useInView` is added alongside `useConceptSpeech`, before the `if (!c)` early return, so React hook order stays stable. `docked` is a plain const computed after the early return (not a hook) — safe.

**Placeholder scan:** no TBD/TODO; every code step shows complete code; every run step gives the exact command + expected result.

**Type consistency:** `useInView<HTMLDivElement>()` returns `{ ref: RefObject<HTMLDivElement>; inView: boolean }` — `ref` attaches to the wrapper `<div>`. `AudioDock` props `{ speech: ConceptSpeech; visible: boolean }` match the call in Task 3. `ConceptSpeech`/`AudioPlayer` are reused unchanged from the existing feature. `data-testid` values (`audio-dock`, `inline-audio`, `target`) are consistent between component and test.

## Execution Handoff

Plan complete. See the "Which approach?" prompt from the writing-plans skill.
