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

  it('reveals the code example on the flipped card via the show-code toggle', async () => {
    render(<MemoryRouter><Learn /></MemoryRouter>);
    // Toggle is not present on the front (question) side
    expect(screen.queryByRole('button', { name: /показать код/i })).not.toBeInTheDocument();

    // Flip to the answer side
    await userEvent.click(screen.getByRole('button', { name: /перевернуть/i }));

    // Toggle appears; code is hidden by default (CodeBlock header "TypeScript" absent)
    const toggle = screen.getByRole('button', { name: /показать код/i });
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();

    // Reveal the code
    await userEvent.click(toggle);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();

    // Toggle now hides it again
    await userEvent.click(screen.getByRole('button', { name: /скрыть код/i }));
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
  });
});
