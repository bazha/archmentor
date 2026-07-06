import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Quiz } from './Quiz';
import { useStore } from '@/store/useStore';

beforeEach(() => {
  useStore.getState().resetProgress();
  useStore.getState().setSettings({ lang: 'ru' });
});

describe('Quiz', () => {
  it('shows a question with options and reveals explanation after answering', async () => {
    render(<MemoryRouter><Quiz /></MemoryRouter>);
    const firstOption = screen.getAllByRole('button').find((b) => b.getAttribute('data-option') === '0')!;
    await userEvent.click(firstOption);
    expect(screen.getByText(/Разбор/i)).toBeInTheDocument();
    expect(useStore.getState().quizResults).toHaveLength(1);
  });
});

describe('Quiz empty filter', () => {
  it('shows an empty state when no questions match', async () => {
    vi.doMock('@/content/index', () => ({ questions: [] }));
    vi.resetModules();
    const { Quiz: FreshQuiz } = await import('./Quiz');
    const { render, screen } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    const { useStore: freshUseStore } = await import('@/store/useStore');
    freshUseStore.getState().setSettings({ lang: 'ru' });
    render(<MemoryRouter><FreshQuiz /></MemoryRouter>);
    expect(screen.getByText('Нет вопросов')).toBeInTheDocument();
    vi.doUnmock('@/content/index');
  });
});

describe('Quiz fill-blank mode', () => {
  beforeEach(() => useStore.getState().setSettings({ lang: 'ru' }));
  it('offers a fill-blank mode and shows a blanked prompt', async () => {
    render(<MemoryRouter><Quiz /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Заполни пропуск' }));
    // a fill-blank prompt contains the blank marker
    expect(screen.getByText(/___/)).toBeInTheDocument();
  });
});
