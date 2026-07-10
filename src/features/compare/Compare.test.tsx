import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Compare } from './Compare';
import { concepts as rawConcepts } from '@/content/index';
import { selectConfusablePairs } from '@/domain/compare/pairs';
import { useStore } from '@/store/useStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/compare/:a?/:b?" element={<Compare />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useStore.getState().setSettings({ lang: 'en' });
});

describe('Compare', () => {
  it('renders both columns for a deep-linked pair', () => {
    const a = rawConcepts[0];
    const b = rawConcepts[1];
    renderAt(`/compare/${a.id}/${b.id}`);
    expect(screen.getByText(a.name)).toBeInTheDocument();
    expect(screen.getByText(b.name)).toBeInTheDocument();
    // Field labels only appear once both are chosen (comparison mode).
    expect(screen.getByText('Definition')).toBeInTheDocument();
  });

  it('shows confusable presets and opens a pair when one is clicked', async () => {
    const pairs = selectConfusablePairs(rawConcepts);
    expect(pairs.length).toBeGreaterThan(0); // sanity: real content has mutual related pairs
    renderAt('/compare');
    // no comparison yet
    expect(screen.queryByText('Definition')).not.toBeInTheDocument();
    const chip = screen.getAllByRole('button').find((el) => el.textContent?.includes('↔'))!;
    await userEvent.click(chip);
    // comparison now rendered
    expect(screen.getByText('Definition')).toBeInTheDocument();
  });

  it('excludes the already-selected concept from the other selector', async () => {
    const a = rawConcepts[0];
    renderAt(`/compare/${a.id}`); // left chosen, right empty
    const rightInput = screen.getAllByRole('combobox')[1];
    await userEvent.click(rightInput); // focus → dropdown lists options
    const optionTexts = screen.getAllByRole('option').map((o) => o.textContent ?? '');
    expect(optionTexts.some((txt) => txt.includes(a.name))).toBe(false);
  });

  it('wires aria-activedescendant to the active option for screen readers', async () => {
    const a = rawConcepts[0];
    renderAt(`/compare/${a.id}`); // left chosen, right empty → both combobox inputs render
    const rightInput = screen.getAllByRole('combobox')[1];
    await userEvent.click(rightInput); // focus opens the dropdown
    await userEvent.keyboard('{ArrowDown}'); // move active from 0 → 1

    const listId = rightInput.getAttribute('aria-controls');
    expect(listId).toBeTruthy();
    const listbox = screen.getAllByRole('listbox')[0];
    expect(listbox).toHaveAttribute('id', listId);

    const activeId = rightInput.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    const activeOption = screen.getAllByRole('option')[1];
    expect(activeOption).toHaveAttribute('id', activeId);
  });
});
