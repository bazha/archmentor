import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useInView } from './useInView';

let ioCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | null;
const observe = vi.fn();
const disconnect = vi.fn();

function stubIO() {
  ioCallback = null;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) { ioCallback = cb; }
    observe = observe;
    unobserve = vi.fn();
    disconnect = disconnect;
    takeRecords = () => [];
    root = null; rootMargin = ''; thresholds = [];
  });
}

function Harness() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return <div ref={ref} data-testid="target" data-inview={String(inView)} />;
}

describe('useInView', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('defaults to inView=true and observes the element', () => {
    stubIO();
    observe.mockClear();
    render(<Harness />);
    expect(screen.getByTestId('target')).toHaveAttribute('data-inview', 'true');
    expect(observe).toHaveBeenCalledTimes(1);
  });

  it('updates inView when the observer reports intersection changes', () => {
    stubIO();
    render(<Harness />);
    act(() => ioCallback!([{ isIntersecting: false }]));
    expect(screen.getByTestId('target')).toHaveAttribute('data-inview', 'false');
    act(() => ioCallback!([{ isIntersecting: true }]));
    expect(screen.getByTestId('target')).toHaveAttribute('data-inview', 'true');
  });

  it('disconnects on unmount', () => {
    stubIO();
    disconnect.mockClear();
    const { unmount } = render(<Harness />);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('stays inView=true when IntersectionObserver is unavailable', () => {
    // no stub — jsdom has no IntersectionObserver
    expect(() => render(<Harness />)).not.toThrow();
    expect(screen.getByTestId('target')).toHaveAttribute('data-inview', 'true');
  });
});
