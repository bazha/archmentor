import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Interview } from './Interview';
import { useStore } from '@/store/useStore';

beforeEach(() => {
  useStore.getState().resetProgress();
  useStore.getState().setSettings({ lang: 'ru' });
});

const findOption = () =>
  screen.getAllByRole('button').find((b) => b.getAttribute('data-option') === '0');

describe('Interview', () => {
  it('renders the intro and shows an answerable question after starting', async () => {
    render(<MemoryRouter><Interview /></MemoryRouter>);
    expect(screen.getByText('Готов к техническому собесу?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Начать собес' }));
    expect(findOption()).toBeTruthy();
  });

  it('offers the system-design round toggle on the intro, unchecked by default', () => {
    render(<MemoryRouter><Interview /></MemoryRouter>);
    const cb = screen.getByRole('checkbox', { name: /system-design/i });
    expect(cb).toBeInTheDocument();
    expect(cb).not.toBeChecked();
  });

  it('runs to a report (with per-grade breakdown) and records the session once under StrictMode', async () => {
    // StrictMode double-invokes effects on mount, so this genuinely exercises the
    // record-exactly-once guard rather than merely asserting the happy path.
    render(<StrictMode><MemoryRouter><Interview /></MemoryRouter></StrictMode>);
    await userEvent.click(screen.getByRole('button', { name: 'Начать собес' }));

    // Answer until the adaptive session resolves (always pick the first option).
    for (let i = 0; i < 40; i++) {
      const opt = findOption();
      if (!opt) break;
      await userEvent.click(opt);
    }

    expect(screen.getByText('Итоги собеса')).toBeInTheDocument();
    // Per-grade breakdown is shown with at least one "correct/total" tally.
    expect(screen.getByText('По уровням')).toBeInTheDocument();
    expect(screen.getAllByText(/^\d+\/\d+$/).length).toBeGreaterThan(0);

    const { interviews } = useStore.getState();
    expect(interviews).toHaveLength(1); // not 2 — StrictMode double-effect is guarded
    expect(interviews[0].asked).toBeGreaterThan(0);
  });

  it('offers the Timed mode toggle on the intro, unchecked by default', () => {
    render(<MemoryRouter><Interview /></MemoryRouter>);
    const cb = screen.getByRole('checkbox', { name: /таймер/i });
    expect(cb).toBeInTheDocument();
    expect(cb).not.toBeChecked();
  });

  it('auto-advances the current question when the timer runs out in timed mode', () => {
    vi.useFakeTimers();
    try {
      render(<MemoryRouter><Interview /></MemoryRouter>);
      fireEvent.click(screen.getByRole('checkbox', { name: /таймер/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Начать собес' }));
      const first = document.querySelector('p.text-xl')?.textContent ?? '';
      expect(first.length).toBeGreaterThan(0); // an active question is shown
      act(() => { vi.advanceTimersByTime(30000); });
      // The original question is no longer the current one (advanced to the next question or the report).
      const after = document.querySelector('p.text-xl')?.textContent ?? '';
      expect(after).not.toBe(first);
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-localizes the currently shown question when the language switches', async () => {
    const { container } = render(<MemoryRouter><Interview /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Начать собес' }));

    const prompt = () => container.querySelector('p.text-xl')?.textContent ?? '';
    const ru = prompt();
    const hasCyrillic = (s: string) => /[а-яА-Я]/.test(s);
    expect(hasCyrillic(ru)).toBe(true); // Russian question shown

    // Toggle language mid-question — the same question must re-localize, not go stale.
    act(() => useStore.getState().setSettings({ lang: 'en' }));

    const en = prompt();
    expect(en).not.toBe(ru);
    expect(hasCyrillic(en)).toBe(false); // now English, no leftover Cyrillic
  });
});
