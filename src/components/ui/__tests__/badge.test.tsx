import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../badge';

describe('Badge', () => {
  // Rendering tests
  it('should render with default variant and size', () => {
    render(<Badge>New</Badge>);

    const badge = screen.getByText('New');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('should render children correctly', () => {
    render(<Badge>Test Badge</Badge>);

    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  // Variant tests
  it('should apply default variant classes', () => {
    render(<Badge variant="default">Default</Badge>);

    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('border-transparent', 'bg-muted', 'text-muted-foreground');
  });

  it('should apply surface variant classes', () => {
    render(<Badge variant="surface">Surface</Badge>);

    const badge = screen.getByText('Surface');
    expect(badge).toHaveClass('bg-surface', 'text-foreground');
  });

  it('should apply outline variant classes', () => {
    render(<Badge variant="outline">Outline</Badge>);

    const badge = screen.getByText('Outline');
    expect(badge).toHaveClass('border-border', 'text-foreground');
  });

  it('should apply primary variant classes', () => {
    render(<Badge variant="primary">Primary</Badge>);

    const badge = screen.getByText('Primary');
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('should apply secondary variant classes', () => {
    render(<Badge variant="secondary">Secondary</Badge>);

    const badge = screen.getByText('Secondary');
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('should apply tertiary variant classes', () => {
    render(<Badge variant="tertiary">Tertiary</Badge>);

    const badge = screen.getByText('Tertiary');
    expect(badge).toHaveClass('bg-tertiary', 'text-tertiary-foreground');
  });

  it('should apply ghost variant classes', () => {
    render(<Badge variant="ghost">Ghost</Badge>);

    const badge = screen.getByText('Ghost');
    expect(badge).toHaveClass('bg-transparent', 'text-muted-foreground');
  });

  // Size tests
  it('should apply sm size classes', () => {
    render(<Badge size="sm">Small</Badge>);

    const badge = screen.getByText('Small');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-[11px]');
  });

  it('should apply md size classes (default)', () => {
    render(<Badge size="md">Medium</Badge>);

    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('px-2.5', 'py-1', 'text-xs');
  });

  it('should apply lg size classes', () => {
    render(<Badge size="lg">Large</Badge>);

    const badge = screen.getByText('Large');
    expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  // Tone tests (Pokemon types)
  it('should apply fire tone classes', () => {
    render(<Badge tone="fire">Fire</Badge>);

    const badge = screen.getByText('Fire');
    expect(badge).toHaveClass('bg-pokemon-fire/20', 'text-pokemon-fire');
  });

  it('should apply water tone classes', () => {
    render(<Badge tone="water">Water</Badge>);

    const badge = screen.getByText('Water');
    expect(badge).toHaveClass('bg-pokemon-water/20', 'text-pokemon-water');
  });

  it('should apply electric tone classes', () => {
    render(<Badge tone="electric">Electric</Badge>);

    const badge = screen.getByText('Electric');
    expect(badge).toHaveClass('bg-pokemon-electric/20', 'text-pokemon-electric');
  });

  it('should apply grass tone classes', () => {
    render(<Badge tone="grass">Grass</Badge>);

    const badge = screen.getByText('Grass');
    expect(badge).toHaveClass('bg-pokemon-grass/20', 'text-pokemon-grass');
  });

  it('should apply psychic tone classes', () => {
    render(<Badge tone="psychic">Psychic</Badge>);

    const badge = screen.getByText('Psychic');
    expect(badge).toHaveClass('bg-pokemon-psychic/20', 'text-pokemon-psychic');
  });

  it('should apply dragon tone classes', () => {
    render(<Badge tone="dragon">Dragon</Badge>);

    const badge = screen.getByText('Dragon');
    expect(badge).toHaveClass('bg-pokemon-dragon/15', 'text-pokemon-dragon');
  });

  it('should apply normal tone classes', () => {
    render(<Badge tone="normal">Normal</Badge>);

    const badge = screen.getByText('Normal');
    expect(badge).toHaveClass('bg-neutral-light/30', 'text-neutral-dark');
  });

  // Combined props tests
  it('should apply tone classes when both variant and tone are provided', () => {
    render(<Badge variant="outline" tone="fire">Fire Type</Badge>);

    const badge = screen.getByText('Fire Type');
    // tone overrides variant color classes
    expect(badge).toHaveClass('bg-pokemon-fire/20', 'text-pokemon-fire');
  });

  it('should apply variant, size and tone together', () => {
    render(
      <Badge variant="primary" size="lg" tone="electric">
        Electric
      </Badge>
    );

    const badge = screen.getByText('Electric');
    expect(badge).toHaveClass('px-3', 'py-1.5'); // size lg
    expect(badge).toHaveClass('bg-pokemon-electric/20'); // tone
  });

  // Custom className tests
  it('should merge custom className with variant classes', () => {
    render(<Badge className="custom-class">Custom</Badge>);

    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
    expect(badge).toHaveClass('bg-muted'); // default variant
  });

  // Accessibility tests
  it('should render as span element', () => {
    const { container } = render(<Badge>Badge</Badge>);

    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Badge');
  });

  it('should support additional HTML attributes', () => {
    render(<Badge title="Badge title" id="test-badge">Badge</Badge>);

    const badge = screen.getByText('Badge');
    expect(badge).toHaveAttribute('title', 'Badge title');
    expect(badge).toHaveAttribute('id', 'test-badge');
  });

  // Base classes tests
  it('should always have base styling classes', () => {
    render(<Badge>Base</Badge>);

    const badge = screen.getByText('Base');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-full',
      'border',
      'font-semibold',
      'uppercase',
      'tracking-wide'
    );
  });
});
