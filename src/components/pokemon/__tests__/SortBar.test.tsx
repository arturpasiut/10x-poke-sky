import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SortBar } from '../SortBar';
import type { SortOption, PokemonSortKey, PokemonSortOrder } from '@/lib/pokemon/types';

describe('SortBar', () => {
  const mockOptions: SortOption[] = [
    { value: 'id', label: 'ID' },
    { value: 'name', label: 'Nazwa' },
    { value: 'type', label: 'Typ' },
  ];

  const defaultProps = {
    options: mockOptions,
    value: 'id' as PokemonSortKey,
    order: 'asc' as PokemonSortOrder,
    onValueChange: vi.fn(),
    onToggleOrder: vi.fn(),
  };

  // Rendering tests
  it('should render sort select with all options', () => {
    render(<SortBar {...defaultProps} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    mockOptions.forEach((option) => {
      expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument();
    });
  });

  it('should display current sort value', () => {
    render(<SortBar {...defaultProps} value="name" />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('name');
  });

  it('should render order toggle button', () => {
    render(<SortBar {...defaultProps} />);

    expect(screen.getByRole('button', { name: /sortowanie/i })).toBeInTheDocument();
  });

  it('should display "↑ Rosnąco" when order is asc', () => {
    render(<SortBar {...defaultProps} order="asc" />);

    expect(screen.getByText('↑ Rosnąco')).toBeInTheDocument();
  });

  it('should display "↓ Malejąco" when order is desc', () => {
    render(<SortBar {...defaultProps} order="desc" />);

    expect(screen.getByText('↓ Malejąco')).toBeInTheDocument();
  });

  // Interaction tests
  it('should call onValueChange when select value changes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<SortBar {...defaultProps} onValueChange={onValueChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'name');

    expect(onValueChange).toHaveBeenCalledWith('name');
  });

  it('should call onToggleOrder when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleOrder = vi.fn();

    render(<SortBar {...defaultProps} onToggleOrder={onToggleOrder} />);

    const toggleButton = screen.getByRole('button', { name: /sortowanie/i });
    await user.click(toggleButton);

    expect(onToggleOrder).toHaveBeenCalledTimes(1);
  });

  // Disabled state tests
  it('should disable select when disabled prop is true', () => {
    render(<SortBar {...defaultProps} disabled={true} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('should disable toggle button when disabled prop is true', () => {
    render(<SortBar {...defaultProps} disabled={true} />);

    const toggleButton = screen.getByRole('button', { name: /sortowanie/i });
    expect(toggleButton).toBeDisabled();
  });

  it('should not call onValueChange when select is disabled', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<SortBar {...defaultProps} onValueChange={onValueChange} disabled={true} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'name');

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('should not call onToggleOrder when button is disabled', async () => {
    const user = userEvent.setup();
    const onToggleOrder = vi.fn();

    render(<SortBar {...defaultProps} onToggleOrder={onToggleOrder} disabled={true} />);

    const toggleButton = screen.getByRole('button', { name: /sortowanie/i });
    await user.click(toggleButton);

    expect(onToggleOrder).not.toHaveBeenCalled();
  });

  // Accessibility tests
  it('should have proper aria-label for toggle button when order is asc', () => {
    render(<SortBar {...defaultProps} order="asc" />);

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-label', 'Zmień sortowanie na malejące');
  });

  it('should have proper aria-label for toggle button when order is desc', () => {
    render(<SortBar {...defaultProps} order="desc" />);

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-label', 'Zmień sortowanie na rosnące');
  });

  it('should have label associated with select', () => {
    const { container } = render(<SortBar {...defaultProps} />);

    const label = container.querySelector('label');
    const select = screen.getByRole('combobox');

    expect(label).toBeInTheDocument();
    expect(label).toContainElement(select);
  });

  // Different options tests
  it('should render with single option', () => {
    const singleOption = [{ value: 'id', label: 'ID' }];

    render(<SortBar {...defaultProps} options={singleOption} />);

    expect(screen.getByRole('option', { name: 'ID' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('should render with many options', () => {
    const manyOptions = Array.from({ length: 10 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i}`,
    }));

    render(<SortBar {...defaultProps} options={manyOptions as SortOption[]} />);

    expect(screen.getAllByRole('option')).toHaveLength(10);
  });

  // Select interaction tests
  it('should allow changing selection multiple times', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<SortBar {...defaultProps} onValueChange={onValueChange} />);

    const select = screen.getByRole('combobox');

    await user.selectOptions(select, 'name');
    expect(onValueChange).toHaveBeenCalledWith('name');

    await user.selectOptions(select, 'type');
    expect(onValueChange).toHaveBeenCalledWith('type');

    expect(onValueChange).toHaveBeenCalledTimes(2);
  });
});
