import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { StatusBanner } from '../StatusBanner';

describe('StatusBanner', () => {
  const defaultProps = {
    title: 'Ładowanie danych',
  };

  // Rendering tests
  it('should render title', () => {
    render(<StatusBanner {...defaultProps} />);

    expect(screen.getByText('Ładowanie danych')).toBeInTheDocument();
  });

  it('should render "Status" label', () => {
    render(<StatusBanner {...defaultProps} />);

    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<StatusBanner {...defaultProps} description="Trwa pobieranie Pokémonów..." />);

    expect(screen.getByText('Trwa pobieranie Pokémonów...')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const { container } = render(<StatusBanner {...defaultProps} />);

    const paragraphs = container.querySelectorAll('p');
    // Only "Status" paragraph should exist
    expect(paragraphs.length).toBe(1);
  });

  // Tone tests - info (default)
  it('should use info tone by default', () => {
    const { container } = render(<StatusBanner {...defaultProps} />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('border-primary-400/60', 'bg-primary-400/10', 'text-primary-100');
  });

  it('should have primary accent color for info tone', () => {
    render(<StatusBanner {...defaultProps} tone="info" />);

    const statusLabel = screen.getByText('Status');
    expect(statusLabel).toHaveClass('text-primary-200');
  });

  // Tone tests - warning
  it('should use warning styles when tone is warning', () => {
    const { container } = render(<StatusBanner {...defaultProps} tone="warning" />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('border-yellow-400/50', 'bg-yellow-400/10', 'text-yellow-100');
  });

  it('should have yellow accent color for warning tone', () => {
    render(<StatusBanner {...defaultProps} tone="warning" />);

    const statusLabel = screen.getByText('Status');
    expect(statusLabel).toHaveClass('text-yellow-300');
  });

  // Dismiss functionality tests
  it('should render dismiss button when onDismiss is provided', () => {
    render(<StatusBanner {...defaultProps} onDismiss={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Ukryj komunikat' })).toBeInTheDocument();
  });

  it('should not render dismiss button when onDismiss is not provided', () => {
    render(<StatusBanner {...defaultProps} />);

    expect(screen.queryByRole('button', { name: 'Ukryj komunikat' })).not.toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<StatusBanner {...defaultProps} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', { name: 'Ukryj komunikat' });
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should show "Zamknij" text in dismiss button', () => {
    render(<StatusBanner {...defaultProps} onDismiss={vi.fn()} />);

    expect(screen.getByText('Zamknij')).toBeInTheDocument();
  });

  // Accessibility tests
  it('should have role="status"', () => {
    render(<StatusBanner {...defaultProps} />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
  });

  it('should have aria-live="polite"', () => {
    const { container } = render(<StatusBanner {...defaultProps} />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-live', 'polite');
  });

  it('should have proper aria-label on dismiss button', () => {
    render(<StatusBanner {...defaultProps} onDismiss={vi.fn()} />);

    const dismissButton = screen.getByRole('button', { name: 'Ukryj komunikat' });
    expect(dismissButton).toHaveAttribute('aria-label', 'Ukryj komunikat');
  });

  // Structure tests
  it('should render as section element', () => {
    const { container } = render(<StatusBanner {...defaultProps} />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('should have header element', () => {
    const { container } = render(<StatusBanner {...defaultProps} />);

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('should have h2 heading', () => {
    render(<StatusBanner {...defaultProps} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Ładowanie danych');
  });

  // Different titles and descriptions
  it('should render with different titles', () => {
    const { rerender } = render(<StatusBanner title="Synchronizacja..." />);

    expect(screen.getByText('Synchronizacja...')).toBeInTheDocument();

    rerender(<StatusBanner title="Aktualizacja bazy danych" />);

    expect(screen.getByText('Aktualizacja bazy danych')).toBeInTheDocument();
  });

  it('should render with long description', () => {
    const longDescription =
      'To jest bardzo długi opis, który zawiera wiele informacji o aktualnym stanie aplikacji i może się zawijać do następnej linii.';

    render(<StatusBanner {...defaultProps} description={longDescription} />);

    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  // Empty values
  it('should render with empty string title', () => {
    render(<StatusBanner title="" />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('');
  });

  it('should not render description paragraph when description is empty string', () => {
    const { container } = render(<StatusBanner {...defaultProps} description="" />);

    // Empty string description is falsy, so no description paragraph is rendered
    const descriptionParagraph = container.querySelector('p.text-sm');
    expect(descriptionParagraph).not.toBeInTheDocument();
  });

  // Combined props test
  it('should render all props together', () => {
    const onDismiss = vi.fn();

    render(
      <StatusBanner
        title="Warning Title"
        description="This is a warning"
        tone="warning"
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Warning Title')).toBeInTheDocument();
    expect(screen.getByText('This is a warning')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ukryj komunikat' })).toBeInTheDocument();

    const statusLabel = screen.getByText('Status');
    expect(statusLabel).toHaveClass('text-yellow-300');
  });

  // Button type test
  it('should have button type="button" for dismiss button', () => {
    render(<StatusBanner {...defaultProps} onDismiss={vi.fn()} />);

    const dismissButton = screen.getByRole('button', { name: 'Ukryj komunikat' });
    expect(dismissButton).toHaveAttribute('type', 'button');
  });

  // Multiple dismissals
  it('should handle multiple dismiss clicks', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<StatusBanner {...defaultProps} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button');
    await user.click(dismissButton);
    await user.click(dismissButton);
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(3);
  });

  // Status label styling
  it('should have uppercase tracking for Status label', () => {
    render(<StatusBanner {...defaultProps} />);

    const statusLabel = screen.getByText('Status');
    expect(statusLabel).toHaveClass('uppercase', 'tracking-[0.3em]');
  });
});
