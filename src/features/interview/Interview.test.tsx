import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('runs to a report and records the completed session exactly once', async () => {
    render(<MemoryRouter><Interview /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Начать собес' }));

    // Answer until the adaptive session resolves (always pick the first option).
    for (let i = 0; i < 40; i++) {
      const opt = findOption();
      if (!opt) break;
      await userEvent.click(opt);
    }

    expect(screen.getByText('Итоги собеса')).toBeInTheDocument();
    const { interviews } = useStore.getState();
    expect(interviews).toHaveLength(1);
    expect(interviews[0].asked).toBeGreaterThan(0);
  });
});
