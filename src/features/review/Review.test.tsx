import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Review } from './Review';
import { useStore } from '@/store/useStore';

beforeEach(() => {
  useStore.getState().resetProgress();
  useStore.getState().setSettings({ lang: 'ru' });
});

describe('Review', () => {
  it('grading a card writes SRS state and advances the queue', async () => {
    render(<Review />);
    await userEvent.click(screen.getByRole('button', { name: /перевернуть/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));
    expect(Object.keys(useStore.getState().srs).length).toBeGreaterThan(0);
  });

  it('grading advances the queue to the next card (DOM-level)', async () => {
    render(<Review />);
    const remaining = () => Number(screen.getByText(/осталось:/).textContent!.match(/\d+/)![0]);
    const before = remaining();
    await userEvent.click(screen.getByRole('button', { name: /перевернуть/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));
    expect(remaining()).toBe(before - 1);
  });
});
