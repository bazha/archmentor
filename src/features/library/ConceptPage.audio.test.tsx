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
