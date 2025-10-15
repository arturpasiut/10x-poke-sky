import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormStatusBanner } from '../FormStatusBanner';
import type { StatusMessage } from '../FormStatusBanner';

describe('FormStatusBanner', () => {
  // Rendering tests
  it('should render success variant', () => {
    const status: StatusMessage = {
      variant: 'success',
      content: 'Operation successful!',
    };

    render(<FormStatusBanner status={status} />);

    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Operation successful!');
  });

  it('should render error variant', () => {
    const status: StatusMessage = {
      variant: 'error',
      content: 'Something went wrong',
    };

    render(<FormStatusBanner status={status} />);

    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Something went wrong');
  });

  it('should render info variant', () => {
    const status: StatusMessage = {
      variant: 'info',
      content: 'Please note this information',
    };

    render(<FormStatusBanner status={status} />);

    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Please note this information');
  });

  // Styling tests
  it('should apply success styling classes', () => {
    const status: StatusMessage = {
      variant: 'success',
      content: 'Success',
    };

    render(<FormStatusBanner status={status} />);

    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('bg-emerald-500/10', 'border-emerald-500/40', 'text-emerald-300');
  });

  it('should apply error styling classes', () => {
    const status: StatusMessage = {
      variant: 'error',
      content: 'Error',
    };

    render(<FormStatusBanner status={status} />);

    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('bg-red-500/10', 'border-red-500/40', 'text-red-200');
  });

  it('should apply info styling classes', () => {
    const status: StatusMessage = {
      variant: 'info',
      content: 'Info',
    };

    render(<FormStatusBanner status={status} />);

    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('bg-blue-500/10', 'border-blue-500/40', 'text-blue-200');
  });

  // Base classes tests
  it('should always have base styling classes', () => {
    const status: StatusMessage = {
      variant: 'info',
      content: 'Message',
    };

    render(<FormStatusBanner status={status} />);

    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('rounded-xl', 'border', 'px-3', 'py-2', 'text-sm', 'transition-colors');
  });

  // Accessibility tests
  it('should have role="status"', () => {
    const status: StatusMessage = {
      variant: 'success',
      content: 'Success',
    };

    render(<FormStatusBanner status={status} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // Content tests
  it('should render multiline content', () => {
    const status: StatusMessage = {
      variant: 'info',
      content: 'Line 1\nLine 2\nLine 3',
    };

    render(<FormStatusBanner status={status} />);

    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });

  it('should render empty content', () => {
    const status: StatusMessage = {
      variant: 'info',
      content: '',
    };

    const { container } = render(<FormStatusBanner status={status} />);

    const banner = container.querySelector('[role="status"]');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('');
  });
});
