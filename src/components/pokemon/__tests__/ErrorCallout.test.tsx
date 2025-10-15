import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ErrorCallout } from '../ErrorCallout';
import type { ApiError } from '@/lib/pokemon/types';

describe('ErrorCallout', () => {
  const mockError: ApiError = {
    code: '500',
    message: 'Wystąpił błąd serwera',
    details: 'Nie udało się połączyć z PokeAPI',
  };

  const defaultProps = {
    error: mockError,
    onRetry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering tests
  it('should render error code', () => {
    render(<ErrorCallout {...defaultProps} />);

    expect(screen.getByText('Błąd: 500')).toBeInTheDocument();
  });

  it('should render error message', () => {
    render(<ErrorCallout {...defaultProps} />);

    expect(screen.getByText('Wystąpił błąd serwera')).toBeInTheDocument();
  });

  it('should render error details when provided', () => {
    render(<ErrorCallout {...defaultProps} />);

    expect(screen.getByText('Nie udało się połączyć z PokeAPI')).toBeInTheDocument();
  });

  it('should not render details when not provided', () => {
    const errorWithoutDetails: ApiError = {
      code: '404',
      message: 'Nie znaleziono',
    };

    render(<ErrorCallout {...defaultProps} error={errorWithoutDetails} />);

    expect(screen.getByText('Nie znaleziono')).toBeInTheDocument();
    expect(screen.queryByText('Nie udało się połączyć z PokeAPI')).not.toBeInTheDocument();
  });

  it('should render title "Nie udało się załadować Pokédexu"', () => {
    render(<ErrorCallout {...defaultProps} />);

    expect(screen.getByText('Nie udało się załadować Pokédexu')).toBeInTheDocument();
  });

  it('should render retry button', () => {
    render(<ErrorCallout {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Spróbuj ponownie' })).toBeInTheDocument();
  });

  // Retry interaction tests
  it('should call onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorCallout {...defaultProps} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Spróbuj ponownie' });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple retry clicks', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorCallout {...defaultProps} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button');
    await user.click(retryButton);
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  // Retrying state tests
  it('should disable retry button when isRetrying is true', () => {
    render(<ErrorCallout {...defaultProps} isRetrying={true} />);

    const retryButton = screen.getByRole('button');
    expect(retryButton).toBeDisabled();
  });

  it('should show "Ponawianie..." when isRetrying is true', () => {
    render(<ErrorCallout {...defaultProps} isRetrying={true} />);

    expect(screen.getByRole('button', { name: 'Ponawianie...' })).toBeInTheDocument();
  });

  it('should not call onRetry when button is disabled during retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorCallout {...defaultProps} onRetry={onRetry} isRetrying={true} />);

    const retryButton = screen.getByRole('button');
    await user.click(retryButton);

    expect(onRetry).not.toHaveBeenCalled();
  });

  // Throttled state tests
  it('should disable retry button when throttled', () => {
    const futureTime = Date.now() + 5000;
    render(<ErrorCallout {...defaultProps} retryDisabledUntil={futureTime} />);

    const retryButton = screen.getByRole('button');
    expect(retryButton).toBeDisabled();
  });

  it('should show "Odczekaj chwilę" when throttled', () => {
    const futureTime = Date.now() + 5000;
    render(<ErrorCallout {...defaultProps} retryDisabledUntil={futureTime} />);

    expect(screen.getByRole('button', { name: 'Odczekaj chwilę' })).toBeInTheDocument();
  });

  it('should enable retry button when throttle time has passed', () => {
    const pastTime = Date.now() - 1000;
    render(<ErrorCallout {...defaultProps} retryDisabledUntil={pastTime} />);

    const retryButton = screen.getByRole('button', { name: 'Spróbuj ponownie' });
    expect(retryButton).not.toBeDisabled();
  });

  it('should handle NaN retryDisabledUntil value', () => {
    render(<ErrorCallout {...defaultProps} retryDisabledUntil={NaN} />);

    const retryButton = screen.getByRole('button', { name: 'Spróbuj ponownie' });
    expect(retryButton).not.toBeDisabled();
  });

  it('should handle undefined retryDisabledUntil', () => {
    render(<ErrorCallout {...defaultProps} retryDisabledUntil={undefined} />);

    const retryButton = screen.getByRole('button', { name: 'Spróbuj ponownie' });
    expect(retryButton).not.toBeDisabled();
  });

  // Combined disabled states
  it('should disable button when both isRetrying and throttled', () => {
    const futureTime = Date.now() + 5000;
    render(<ErrorCallout {...defaultProps} isRetrying={true} retryDisabledUntil={futureTime} />);

    const retryButton = screen.getByRole('button');
    expect(retryButton).toBeDisabled();
  });

  // Accessibility tests
  it('should have role="alert"', () => {
    render(<ErrorCallout {...defaultProps} />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('should have aria-live="assertive"', () => {
    const { container } = render(<ErrorCallout {...defaultProps} />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-live', 'assertive');
  });

  // Different error codes
  it('should render 404 error code', () => {
    const error404: ApiError = {
      code: '404',
      message: 'Nie znaleziono zasobu',
    };

    render(<ErrorCallout {...defaultProps} error={error404} />);

    expect(screen.getByText('Błąd: 404')).toBeInTheDocument();
    expect(screen.getByText('Nie znaleziono zasobu')).toBeInTheDocument();
  });

  it('should render 429 error code', () => {
    const error429: ApiError = {
      code: '429',
      message: 'Zbyt wiele żądań',
      details: 'Spróbuj ponownie za chwilę',
    };

    render(<ErrorCallout {...defaultProps} error={error429} />);

    expect(screen.getByText('Błąd: 429')).toBeInTheDocument();
    expect(screen.getByText('Zbyt wiele żądań')).toBeInTheDocument();
    expect(screen.getByText('Spróbuj ponownie za chwilę')).toBeInTheDocument();
  });

  // Structure tests
  it('should render as section element', () => {
    const { container } = render(<ErrorCallout {...defaultProps} />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('role', 'alert');
  });

  it('should have header element', () => {
    const { container } = render(<ErrorCallout {...defaultProps} />);

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('should have h2 heading', () => {
    render(<ErrorCallout {...defaultProps} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Nie udało się załadować Pokédexu');
  });

  // Styling tests
  it('should have error styling classes', () => {
    const { container } = render(<ErrorCallout {...defaultProps} />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('border-red-500/30', 'bg-red-500/10');
  });

  it('should have outline variant button', () => {
    render(<ErrorCallout {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-red-400/70', 'text-red-100');
  });
});
