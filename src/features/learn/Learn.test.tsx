import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Learn } from './Learn';
import { useStore } from '@/store/useStore';

beforeEach(() => {
  useStore.getState().resetProgress();
  useStore.getState().setSettings({ lang: 'ru' });
});

describe('Learn', () => {
  it('flips a card to reveal the definition', async () => {
    render(<MemoryRouter><Learn /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /перевернуть/i }));
    expect(screen.getByText('Определение')).toBeInTheDocument();
  });

  it('advancing marks the concept as seen in the store', async () => {
    render(<MemoryRouter><Learn /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /следующая/i }));
    expect(Object.keys(useStore.getState().conceptProgress).length).toBeGreaterThan(0);
  });
});
