import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Library } from '@/features/library/Library';

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

describe('app shell', () => {
  it('renders nav and dashboard at /', () => {
    renderAt('/');
    expect(screen.getByText('ArchMentor')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Библиотека' })).toBeInTheDocument();
  });

  it('renders library at /library', () => {
    renderAt('/library');
    // Both the nav link and the placeholder heading read "Библиотека";
    // scope to the heading role to disambiguate.
    expect(screen.getByRole('heading', { name: 'Библиотека' })).toBeInTheDocument();
  });
});
