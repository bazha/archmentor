import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and hint', () => {
    render(<MemoryRouter><EmptyState title="Ничего нет" hint="Загляните позже" /></MemoryRouter>);
    expect(screen.getByText('Ничего нет')).toBeInTheDocument();
    expect(screen.getByText('Загляните позже')).toBeInTheDocument();
  });

  it('renders a CTA link when provided', () => {
    render(<MemoryRouter><EmptyState title="Пусто" cta={{ to: '/quiz', label: 'В квиз' }} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'В квиз' })).toHaveAttribute('href', '/quiz');
  });
});
