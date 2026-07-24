import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeBlock } from './CodeBlock';
import { FlipCard } from './FlipCard';
import { ProgressBar } from './ProgressBar';
import { PillGroup } from './PillGroup';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().setSettings({ lang: 'ru' }));

describe('shared components', () => {
  it('CodeBlock renders the code text', () => {
    const { container } = render(<CodeBlock sample={{ lang: 'typescript', code: 'const answer = 42;' }} />);
    expect(container).toHaveTextContent('const answer = 42;');
  });

  it('CodeBlock uses the Fira Code font stack', () => {
    const { container } = render(<CodeBlock sample={{ lang: 'typescript', code: 'const answer = 42;' }} />);
    const code = container.querySelector('code');
    expect(code?.style.fontFamily).toContain('Fira Code');
  });

  it('FlipCard shows front, then back after onFlip driven by parent', async () => {
    const onFlip = vi.fn();
    const { rerender } = render(<FlipCard front="ЛИЦО" back="ОБОРОТ" flipped={false} onFlip={onFlip} />);
    await userEvent.click(screen.getByRole('button', { name: /перевернуть/i }));
    expect(onFlip).toHaveBeenCalled();
    rerender(<FlipCard front="ЛИЦО" back="ОБОРОТ" flipped={true} onFlip={onFlip} />);
    expect(screen.getByText('ОБОРОТ')).toBeVisible();
  });

  it('ProgressBar exposes value via aria', () => {
    render(<ProgressBar value={40} label="Junior" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
  });

  it('PillGroup calls onChange with the picked value', async () => {
    const onChange = vi.fn();
    render(<PillGroup options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} value="a" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
