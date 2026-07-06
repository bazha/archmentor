import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageToggle } from './LanguageToggle';
import { useStore } from '@/store/useStore';

describe('LanguageToggle', () => {
  beforeEach(() => useStore.getState().setSettings({ lang: 'ru' }));
  it('shows the other language and switches on click', async () => {
    render(<LanguageToggle />);
    const btn = screen.getByRole('button', { name: /язык|language/i });
    expect(btn).toHaveTextContent('EN');
    await userEvent.click(btn);
    expect(useStore.getState().settings.lang).toBe('en');
  });
});
