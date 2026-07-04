import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Library } from './Library';
import { ConceptPage } from './ConceptPage';

function renderLib(path = '/library') {
  const router = createMemoryRouter(
    [{ path: 'library', element: <Library /> }, { path: 'library/:conceptId', element: <ConceptPage /> }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Library', () => {
  it('lists concept cards including Strategy', () => {
    renderLib();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
  });

  it('filters by search query', async () => {
    renderLib();
    await userEvent.type(screen.getByPlaceholderText(/поиск/i), 'Observer');
    expect(screen.getByText('Observer')).toBeInTheDocument();
    expect(screen.queryByText('Strategy')).not.toBeInTheDocument();
  });

  it('concept page shows definition, code, pros and cons', () => {
    renderLib('/library/strategy');
    expect(screen.getByText(/семейство алгоритмов/i)).toBeInTheDocument();
    expect(screen.getByText(/Плюсы/)).toBeInTheDocument();
    expect(screen.getByText(/Минусы/)).toBeInTheDocument();
  });
});
