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
    // inline player should not have invisible class while in view
    expect(screen.getByTestId('inline-audio')).not.toHaveClass('invisible');

    // inline player scrolls out of view → dock shows
    act(() => ioCallback!([{ isIntersecting: false }]));
    expect(screen.getByTestId('audio-dock')).not.toHaveAttribute('aria-hidden');
    // inline player wrapper becomes aria-hidden so SRs see one control set
    expect(screen.getByTestId('inline-audio')).toHaveAttribute('aria-hidden', 'true');
    // also remove from tab order with invisible
    expect(screen.getByTestId('inline-audio')).toHaveClass('invisible');

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
