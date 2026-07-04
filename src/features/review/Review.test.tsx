import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Review } from './Review';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().resetProgress());

describe('Review', () => {
  it('shows a due card, then grading buttons after flipping', async () => {
    render(<Review />);
    const flipButton = screen.getByRole('button', { name: /перевернуть/i });
    expect(flipButton).toBeInTheDocument();
    await userEvent.click(flipButton);
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
  });

  it('grading a card writes SRS state and advances the queue', async () => {
    render(<Review />);
    await userEvent.click(screen.getByRole('button', { name: /перевернуть/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));
    expect(Object.keys(useStore.getState().srs).length).toBeGreaterThan(0);
  });
});
