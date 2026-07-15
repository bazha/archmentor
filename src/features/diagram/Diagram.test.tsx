import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Diagram } from './Diagram';
import { scenarios } from '@/content/diagram';
import { componentNames } from '@/content/diagram';
import { useStore } from '@/store/useStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/diagram/:scenarioId?" element={<Diagram />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useStore.getState().resetProgress();
  useStore.getState().setSettings({ lang: 'en' });
});

describe('Diagram screen', () => {
  it('lists scenarios on the picker', () => {
    renderAt('/diagram');
    expect(screen.getByText(scenarios[0].title.en)).toBeInTheDocument();
  });

  it('builds a passing diagram and shows an accepted report', async () => {
    const user = userEvent.setup();
    renderAt('/diagram/url-shortener'); // requires client, api-server, cache, a datastore
    await user.click(screen.getByRole('button', { name: `+ ${componentNames.client.en}` }));
    await user.click(screen.getByRole('button', { name: `+ ${componentNames['api-server'].en}` }));
    await user.click(screen.getByRole('button', { name: `+ ${componentNames.cache.en}` }));
    await user.click(screen.getByRole('button', { name: `+ ${componentNames['sql-db'].en}` }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Diagram accepted')).toBeInTheDocument();
    expect(useStore.getState().diagram.completed['url-shortener'].passed).toBe(true);
  });

  it('marks a scenario missing a required node as having issues', async () => {
    const user = userEvent.setup();
    renderAt('/diagram/url-shortener');
    await user.click(screen.getByRole('button', { name: `+ ${componentNames.client.en}` }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Some notes')).toBeInTheDocument();
    expect(useStore.getState().diagram.completed['url-shortener'].passed).toBe(false);
  });

  it('groups the picker by grade with headings and badges', () => {
    renderAt('/diagram');
    // grade section headings (also used as badges → appear more than once)
    expect(screen.getAllByText('Junior').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lead').length).toBeGreaterThan(0);
    // a known lead scenario renders under its group
    expect(screen.getByText('Video streaming')).toBeInTheDocument();
  });
});
