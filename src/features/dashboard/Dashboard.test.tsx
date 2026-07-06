import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { useStore } from '@/store/useStore';

beforeEach(() => {
  useStore.getState().resetProgress();
  useStore.getState().setSettings({ lang: 'ru' });
});

describe('Dashboard', () => {
  it('renders a progress bar per grade', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Junior — освоено/)).toBeInTheDocument();
    expect(screen.getByText(/Lead — освоено/)).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar').length).toBe(4);
  });

  it('shows current streak', () => {
    useStore.getState().reviewConcept('srp', 4, '2026-07-04');
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Серия/)).toBeInTheDocument();
  });
});
