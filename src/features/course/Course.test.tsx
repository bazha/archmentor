import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Course } from './Course';
import { useStore } from '@/store/useStore';

describe('Course screen', () => {
  beforeEach(() => useStore.getState().resetProgress());

  it('renders the four grade sections and the progress summary (ru)', () => {
    useStore.getState().setSettings({ lang: 'ru' });
    render(<MemoryRouter><Course /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Курс' })).toBeInTheDocument();
    for (const g of ['Junior', 'Middle', 'Senior', 'Lead'])
      expect(screen.getByRole('heading', { name: g })).toBeInTheDocument();
    // first step highlighted with its concept name (srp = "Single Responsibility Principle")
    expect(screen.getByText('Single Responsibility Principle')).toBeInTheDocument();
    // progress summary: fresh store → 0 of 42 mastered, interpolated
    expect(screen.getByText('Освоено 0/42')).toBeInTheDocument();
  });

  it('renders in English', () => {
    useStore.getState().setSettings({ lang: 'en' });
    render(<MemoryRouter><Course /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Course' })).toBeInTheDocument();
    expect(screen.getAllByText('Not started').length).toBeGreaterThan(0);
  });
});
