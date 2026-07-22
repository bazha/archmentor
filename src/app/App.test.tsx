import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Library } from '@/features/library/Library';
import { useStore } from '@/store/useStore';
import type { Lang } from '@/i18n/lang';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [{ path: '/', element: <Layout />, children: [
      { index: true, element: <Dashboard /> },
      { path: 'library', element: <Library /> },
    ] }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

// The shell renders correctly in both languages; the library nav link and the
// library page heading share a label, so heading-role scoping disambiguates.
const CASES: { lang: Lang; library: string; dashboard: string }[] = [
  { lang: 'ru', library: 'Библиотека', dashboard: 'Путь от Junior до Lead' },
  { lang: 'en', library: 'Library', dashboard: 'The path from Junior to Lead' },
];

describe.each(CASES)('app shell ($lang)', ({ lang, library, dashboard }) => {
  beforeEach(() => useStore.getState().setSettings({ lang }));

  it('renders the nav and dashboard at /', () => {
    renderAt('/');
    expect(screen.getByText('ArchMentor')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: library })).toBeInTheDocument();
    expect(screen.getByText(dashboard)).toBeInTheDocument();
  });

  it('links the sidebar brandmark home with a title', () => {
    renderAt('/library');
    const brandmark = screen.getByTitle('ArchMentor — home');
    expect(brandmark).toBeInTheDocument();
    expect(brandmark).toHaveAttribute('href', '/');
  });

  it('renders the library heading at /library', () => {
    renderAt('/library');
    expect(screen.getByRole('heading', { name: library })).toBeInTheDocument();
  });
});
