import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Daily } from './Daily';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';

beforeEach(() => {
  useStore.getState().resetProgress();
  useStore.getState().setSettings({ lang: 'ru' });
});

const options = () => screen.getAllByRole('button').filter((b) => b.getAttribute('data-option') !== null);

describe('Daily', () => {
  it('answers the daily question: reveals the explanation, marks it done, and streaks', async () => {
    render(<MemoryRouter><Daily /></MemoryRouter>);
    expect(useStore.getState().daily.lastCompletedDate).toBeNull();

    await userEvent.click(options()[0]);

    expect(screen.getByText(/Разбор/i)).toBeInTheDocument();
    expect(screen.getByText('Возвращайтесь завтра за новой.')).toBeInTheDocument();
    const s = useStore.getState();
    expect(s.daily.lastCompletedDate).toBe(todayISO());
    expect(s.daily.streak).toBe(1);
  });

  it('when already solved today, shows the revealed answer with no answerable options', () => {
    useStore.getState().completeDaily(0, todayISO()); // pre-solved
    render(<MemoryRouter><Daily /></MemoryRouter>);
    expect(screen.getByText('Задача дня решена')).toBeInTheDocument();
    // every option button is disabled (cannot re-answer)
    expect(options().every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });
});

describe('Daily empty bank', () => {
  it('shows an empty state when there are no questions', async () => {
    vi.doMock('@/content/index', () => ({ questions: [], concepts: [], getConcept: () => undefined }));
    vi.resetModules();
    const { Daily: FreshDaily } = await import('./Daily');
    const { render: r, screen: sc } = await import('@testing-library/react');
    const { MemoryRouter: MR } = await import('react-router-dom');
    const { useStore: fresh } = await import('@/store/useStore');
    fresh.getState().setSettings({ lang: 'ru' });
    r(<MR><FreshDaily /></MR>);
    expect(sc.getByText('Нет вопросов')).toBeInTheDocument();
    vi.doUnmock('@/content/index');
  });
});
