import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EmptyStateWithAI } from '../EmptyStateWithAI';

describe('EmptyStateWithAI', () => {
  const defaultProps = {
    ctaLabel: 'Otwórz AI Chat',
    onCta: vi.fn(),
  };

  // Rendering tests
  it('should render with default title and description', () => {
    render(<EmptyStateWithAI {...defaultProps} />);

    expect(screen.getByText('Brak wyników dla wybranych filtrów')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Spróbuj dostosować wyszukiwanie lub poproś nasze AI o pomoc w znalezieniu odpowiedniego Pokémona.'
      )
    ).toBeInTheDocument();
  });

  it('should render CTA button with provided label', () => {
    render(<EmptyStateWithAI {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Otwórz AI Chat' })).toBeInTheDocument();
  });

  it('should render "Pusto?" label', () => {
    render(<EmptyStateWithAI {...defaultProps} />);

    expect(screen.getByText('Pusto?')).toBeInTheDocument();
  });

  // Custom props tests
  it('should render with custom title', () => {
    render(<EmptyStateWithAI {...defaultProps} title="Nie znaleziono Pokémonów" />);

    expect(screen.getByText('Nie znaleziono Pokémonów')).toBeInTheDocument();
    expect(screen.queryByText('Brak wyników dla wybranych filtrów')).not.toBeInTheDocument();
  });

  it('should render with custom description', () => {
    render(<EmptyStateWithAI {...defaultProps} description="Spróbuj użyć innych kryteriów" />);

    expect(screen.getByText('Spróbuj użyć innych kryteriów')).toBeInTheDocument();
  });

  it('should render with both custom title and description', () => {
    render(
      <EmptyStateWithAI
        {...defaultProps}
        title="Custom Title"
        description="Custom Description"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });

  // Interaction tests
  it('should call onCta when button is clicked', async () => {
    const user = userEvent.setup();
    const onCta = vi.fn();

    render(<EmptyStateWithAI {...defaultProps} onCta={onCta} />);

    const button = screen.getByRole('button', { name: 'Otwórz AI Chat' });
    await user.click(button);

    expect(onCta).toHaveBeenCalledTimes(1);
  });

  it('should call onCta multiple times on multiple clicks', async () => {
    const user = userEvent.setup();
    const onCta = vi.fn();

    render(<EmptyStateWithAI {...defaultProps} onCta={onCta} />);

    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(onCta).toHaveBeenCalledTimes(3);
  });

  // Structure tests
  it('should render as section element', () => {
    const { container } = render(<EmptyStateWithAI {...defaultProps} />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('should have h2 heading for title', () => {
    render(<EmptyStateWithAI {...defaultProps} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Brak wyników dla wybranych filtrów');
  });

  // Button size test
  it('should render button with large size', () => {
    render(<EmptyStateWithAI {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  // Different CTA labels
  it('should render with different CTA labels', () => {
    const { rerender } = render(<EmptyStateWithAI {...defaultProps} ctaLabel="Zapytaj AI" />);

    expect(screen.getByRole('button', { name: 'Zapytaj AI' })).toBeInTheDocument();

    rerender(<EmptyStateWithAI {...defaultProps} ctaLabel="Pomoc AI" />);

    expect(screen.getByRole('button', { name: 'Pomoc AI' })).toBeInTheDocument();
  });

  // Empty title/description edge cases
  it('should render with empty string title', () => {
    render(<EmptyStateWithAI {...defaultProps} title="" />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('');
  });

  it('should render with empty string description', () => {
    const { container } = render(<EmptyStateWithAI {...defaultProps} description="" />);

    // Description paragraph should still exist but be empty
    const paragraphs = container.querySelectorAll('p');
    const descriptionParagraph = Array.from(paragraphs).find((p) =>
      p.className.includes('max-w-xl')
    );
    expect(descriptionParagraph).toHaveTextContent('');
  });

  // Styling tests
  it('should have proper styling classes', () => {
    const { container } = render(<EmptyStateWithAI {...defaultProps} />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });

  it('should have "Pusto?" label with primary color', () => {
    render(<EmptyStateWithAI {...defaultProps} />);

    const label = screen.getByText('Pusto?');
    expect(label).toHaveClass('text-primary-300');
  });

  // Accessibility
  it('should have accessible button', () => {
    render(<EmptyStateWithAI {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Otwórz AI Chat' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});
