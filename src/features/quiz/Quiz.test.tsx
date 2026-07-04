import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Quiz } from './Quiz';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().resetProgress());

describe('Quiz', () => {
  it('shows a question with options and reveals explanation after answering', async () => {
    render(<MemoryRouter><Quiz /></MemoryRouter>);
    const firstOption = screen.getAllByRole('button').find((b) => b.getAttribute('data-option') === '0')!;
    await userEvent.click(firstOption);
    expect(screen.getByText(/Разбор/i)).toBeInTheDocument();
    expect(useStore.getState().quizResults).toHaveLength(1);
  });
});
