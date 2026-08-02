import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GithubLink } from './GithubLink';

describe('GithubLink', () => {
  it('links to the GitHub repository with an accessible label', () => {
    render(<GithubLink />);
    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/bazha/archmentor');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('shows the repo name', () => {
    render(<GithubLink />);
    expect(screen.getByText('archmentor')).toBeInTheDocument();
  });
});
