import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioPlayer } from './AudioPlayer';
import type { ConceptSpeech } from './useConceptSpeech';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().setSettings({ lang: 'ru' }));

function speechStub(over: Partial<ConceptSpeech> = {}): ConceptSpeech {
  return {
    status: 'idle', activeId: null, ordinal: 0, total: 5, rate: 1,
    play: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn(),
    setRate: vi.fn(), jumpTo: vi.fn(), ...over,
  };
}

describe('AudioPlayer', () => {
  it('renders nothing when unsupported', () => {
    const { container } = render(<AudioPlayer speech={speechStub({ status: 'unsupported' })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows Listen when idle and calls play on click', async () => {
    const speech = speechStub();
    render(<AudioPlayer speech={speech} />);
    await userEvent.click(screen.getByRole('button', { name: 'Слушать' }));
    expect(speech.play).toHaveBeenCalled();
  });

  it('shows pause + stop and progress while playing', () => {
    render(<AudioPlayer speech={speechStub({ status: 'playing', ordinal: 2, total: 5 })} />);
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Стоп' })).toBeInTheDocument();
    expect(screen.getByText('Секция 2 из 5')).toBeInTheDocument();
  });

  it('shows resume when paused', () => {
    render(<AudioPlayer speech={speechStub({ status: 'paused', ordinal: 1 })} />);
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeInTheDocument();
  });

  it('changing speed calls setRate', async () => {
    const speech = speechStub();
    render(<AudioPlayer speech={speech} />);
    await userEvent.selectOptions(screen.getByLabelText('Скорость'), '1.5');
    expect(speech.setRate).toHaveBeenCalledWith(1.5);
  });
});
