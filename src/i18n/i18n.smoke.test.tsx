import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Layout } from '@/app/Layout';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Library } from '@/features/library/Library';
import { useStore } from '@/store/useStore';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [{ path: '/', element: <Layout />, children: [
      { index: true, element: <Dashboard /> },
      { path: 'library', element: <Library /> },
    ] }], { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('English UI', () => {
  beforeEach(() => useStore.getState().setSettings({ lang: 'en' }));
  it('renders nav and dashboard in English', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Library' })).toBeInTheDocument();
    expect(screen.getByText('The path from Junior to Lead')).toBeInTheDocument();
  });
  it('renders the library heading in English', () => {
    renderAt('/library');
    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument();
  });
});
