// src/features/library/AudioDock.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudioDock } from './AudioDock';
import type { ConceptSpeech } from './useConceptSpeech';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().setSettings({ lang: 'ru' }));

function speechStub(over: Partial<ConceptSpeech> = {}): ConceptSpeech {
  return {
    status: 'playing', activeId: 'tagline', ordinal: 1, total: 5, rate: 1,
    play: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn(),
    setRate: vi.fn(), jumpTo: vi.fn(), ...over,
  };
}

describe('AudioDock', () => {
  it('renders nothing when speech is unsupported', () => {
    render(<AudioDock speech={speechStub({ status: 'unsupported' })} visible={true} />);
    expect(screen.queryByTestId('audio-dock')).not.toBeInTheDocument();
  });

  it('when visible, shows the controls and is not aria-hidden', () => {
    render(<AudioDock speech={speechStub({ status: 'playing' })} visible={true} />);
    const dock = screen.getByTestId('audio-dock');
    expect(dock).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeInTheDocument();
  });

  it('when hidden, is aria-hidden and its controls are out of the a11y tree', () => {
    render(<AudioDock speech={speechStub({ status: 'playing' })} visible={false} />);
    const dock = screen.getByTestId('audio-dock');
    expect(dock).toHaveAttribute('aria-hidden', 'true');
    // getByRole ignores aria-hidden subtrees → the control is not accessible
    expect(screen.queryByRole('button', { name: 'Пауза' })).not.toBeInTheDocument();
  });
});
