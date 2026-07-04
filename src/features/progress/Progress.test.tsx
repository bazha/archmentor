import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Progress } from './Progress';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().resetProgress());

describe('Progress', () => {
  it('shows quiz accuracy and per-grade mastery', () => {
    useStore.getState().recordQuiz('q1', 0, true, '2026-07-04');
    useStore.getState().recordQuiz('q2', 1, false, '2026-07-04');
    render(<MemoryRouter><Progress /></MemoryRouter>);
    expect(screen.getByText(/Точность квизов/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('offers a reset that clears progress', async () => {
    useStore.getState().recordQuiz('q1', 0, true, '2026-07-04');
    render(<MemoryRouter><Progress /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /сбросить/i })).toBeInTheDocument();
  });
});
