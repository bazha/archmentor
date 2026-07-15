import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Report } from './Report';
import { useStore } from '@/store/useStore';
import type { CheckResult } from '@/domain/diagram/types';

const results: CheckResult[] = [
  { status: 'ok', messageKey: 'diagram.check.required', params: { node: 'client' } },
  { status: 'fail', messageKey: 'diagram.check.missing', params: { node: 'cache' } },
];

beforeEach(() => useStore.getState().setSettings({ lang: 'en' }));

describe('Report', () => {
  it('renders an explanation under a line when provided', () => {
    render(<Report results={results} explanations={['Because caching helps', undefined]} />);
    expect(screen.getByText('Because caching helps')).toBeInTheDocument();
  });

  it('renders no explanation sub-text when none is provided', () => {
    render(<Report results={results} />);
    expect(screen.queryByText('Because caching helps')).not.toBeInTheDocument();
    // both result lines still render
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
