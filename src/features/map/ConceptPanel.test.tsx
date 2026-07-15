import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConceptPanel } from './ConceptPanel';
import type { ConceptView } from '@/content/localize';
import { useStore } from '@/store/useStore';

const concept: ConceptView = {
  id: 'strategy', name: 'Strategy', category: 'behavioral', grade: 'middle',
  tagline: 'Swap algorithms at runtime', definition: 'd', problem: 'p', solution: 's',
  codeExample: { lang: 'typescript', code: 'x' },
  pros: ['a'], cons: ['a'], tradeoffs: ['a'], whenToUse: ['a'], related: ['state'],
};

beforeEach(() => useStore.getState().setSettings({ lang: 'en' }));

const renderPanel = (props: Partial<Parameters<typeof ConceptPanel>[0]> = {}) =>
  render(
    <MemoryRouter>
      <ConceptPanel concept={concept} related={[{ id: 'state', name: 'State' }]} onSelect={() => {}} {...props} />
    </MemoryRouter>,
  );

describe('ConceptPanel', () => {
  it('shows a hint when nothing is selected', () => {
    render(<MemoryRouter><ConceptPanel concept={null} related={[]} onSelect={() => {}} /></MemoryRouter>);
    expect(screen.getByText('Select a concept on the map to see its connections.')).toBeInTheDocument();
  });

  it('renders the concept name, tagline, and a Library link', () => {
    renderPanel();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Swap algorithms at runtime')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Library/ })).toHaveAttribute('href', '/library/strategy');
  });

  it('calls onSelect when a related chip is clicked', async () => {
    const onSelect = vi.fn();
    renderPanel({ onSelect });
    await userEvent.click(screen.getByRole('button', { name: 'State' }));
    expect(onSelect).toHaveBeenCalledWith('state');
  });
});
