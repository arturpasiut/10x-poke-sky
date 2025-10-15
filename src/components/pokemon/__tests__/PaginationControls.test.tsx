import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { PaginationControls } from '../PaginationControls';
import type { PaginationViewModel } from '@/lib/pokemon/types';

describe('PaginationControls', () => {
  const mockPagination: PaginationViewModel = {
    page: 2,
    pageCount: 5,
    hasNext: true,
    hasPrevious: true,
  };

  const defaultProps = {
    pagination: mockPagination,
    onPageChange: vi.fn(),
  };

  // Rendering tests
  it('should render pagination controls with correct info', () => {
    render(<PaginationControls {...defaultProps} />);

    expect(screen.getByText('Strona 2 z 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Poprzednia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Następna' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Przejdź' })).toBeInTheDocument();
  });

  it('should render page input with current page', () => {
    render(<PaginationControls {...defaultProps} />);

    const input = screen.getByRole('spinbutton', { name: 'Numer strony' }) as HTMLInputElement;
    expect(input).toHaveValue(2);
  });

  it('should show "Brak wyników" when pageCount is 0', () => {
    const noPagination = {
      ...mockPagination,
      pageCount: 0,
    };

    render(<PaginationControls pagination={noPagination} onPageChange={vi.fn()} />);

    expect(screen.getByText('Brak wyników do paginacji')).toBeInTheDocument();
  });

  it('should not render navigation when pageCount is 1', () => {
    const singlePage = {
      ...mockPagination,
      page: 1,
      pageCount: 1,
      hasNext: false,
      hasPrevious: false,
    };

    render(<PaginationControls pagination={singlePage} onPageChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Poprzednia' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Następna' })).not.toBeInTheDocument();
  });

  // Previous button tests
  it('should call onPageChange with page-1 when previous button is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);

    const prevButton = screen.getByRole('button', { name: 'Poprzednia' });
    await user.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should disable previous button when hasPrevious is false', () => {
    const firstPage = {
      ...mockPagination,
      page: 1,
      hasPrevious: false,
    };

    render(<PaginationControls pagination={firstPage} onPageChange={vi.fn()} />);

    const prevButton = screen.getByRole('button', { name: 'Poprzednia' });
    expect(prevButton).toBeDisabled();
  });

  // Next button tests
  it('should call onPageChange with page+1 when next button is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);

    const nextButton = screen.getByRole('button', { name: 'Następna' });
    await user.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('should disable next button when hasNext is false', () => {
    const lastPage = {
      ...mockPagination,
      page: 5,
      pageCount: 5,
      hasNext: false,
    };

    render(<PaginationControls pagination={lastPage} onPageChange={vi.fn()} />);

    const nextButton = screen.getByRole('button', { name: 'Następna' });
    expect(nextButton).toBeDisabled();
  });

  // Page input tests
  it('should update input value when user types', async () => {
    const user = userEvent.setup();
    render(<PaginationControls {...defaultProps} />);

    const input = screen.getByRole('spinbutton', { name: 'Numer strony' });
    await user.clear(input);
    await user.type(input, '4');

    expect(input).toHaveValue(4);
  });

  it('should call onPageChange when form is submitted with valid page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);

    const input = screen.getByRole('spinbutton', { name: 'Numer strony' });

    await user.clear(input);
    await user.type(input, '4');
    await user.keyboard('{Enter}');

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('should not call onPageChange when page is below 1', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);

    const input = screen.getByRole('spinbutton', { name: 'Numer strony' });

    await user.clear(input);
    await user.type(input, '0');
    await user.keyboard('{Enter}');

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('should not call onPageChange when page is above pageCount', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);

    const input = screen.getByRole('spinbutton', { name: 'Numer strony' });

    await user.clear(input);
    await user.type(input, '10');
    await user.keyboard('{Enter}');

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('should reset input value to current page on blur', async () => {
    const user = userEvent.setup();
    render(<PaginationControls {...defaultProps} />);

    const input = screen.getByRole('spinbutton', { name: 'Numer strony' });

    await user.clear(input);
    await user.type(input, '999');
    await user.tab();

    await waitFor(() => {
      expect(input).toHaveValue(2);
    });
  });

  // Loading state tests
  it('should disable all buttons when isLoading is true', () => {
    render(<PaginationControls {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: 'Poprzednia' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Następna' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Przejdź' })).toBeDisabled();
  });

  it('should disable input when isLoading is true', () => {
    render(<PaginationControls {...defaultProps} isLoading={true} />);

    const input = screen.getByRole('spinbutton', { name: 'Numer strony' });
    expect(input).toBeDisabled();
  });

  // Accessibility tests
  it('should have navigation landmark', () => {
    const { container } = render(<PaginationControls {...defaultProps} />);

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', 'Nawigacja po stronach');
  });

  it('should have proper input attributes', () => {
    render(<PaginationControls {...defaultProps} />);

    const input = screen.getByRole('spinbutton', { name: 'Numer strony' });
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '5');
  });

  // Edge cases
  it('should handle pageCount of 1', () => {
    const singlePage = {
      page: 1,
      pageCount: 1,
      hasNext: false,
      hasPrevious: false,
    };

    render(<PaginationControls pagination={singlePage} onPageChange={vi.fn()} />);

    expect(screen.getByText('Strona 1 z 1')).toBeInTheDocument();
  });

  it('should handle very large pageCount', () => {
    const largePagination = {
      page: 50,
      pageCount: 1000,
      hasNext: true,
      hasPrevious: true,
    };

    render(<PaginationControls pagination={largePagination} onPageChange={vi.fn()} />);

    expect(screen.getByText('Strona 50 z 1000')).toBeInTheDocument();
    expect(screen.getByText('/ 1000')).toBeInTheDocument();
  });
});
