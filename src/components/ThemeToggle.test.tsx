import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';
import { useStore } from '@/store/useStore';

describe('ThemeToggle', () => {
  beforeEach(() => useStore.getState().setSettings({ theme: 'dark' }));

  it('exposes an accessible label and pressed state', () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button', { name: /переключить/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles the persisted theme on click', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: /переключить/i }));
    expect(useStore.getState().settings.theme).toBe('light');
  });
});
