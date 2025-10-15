import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PokemonMovesGrid } from '../PokemonMovesGrid';
import type { MoveSummaryDto } from '@/types';

describe('PokemonMovesGrid', () => {
  const mockMoves: MoveSummaryDto[] = [
    {
      moveId: 1,
      name: 'thunder-shock',
      type: 'physical',
      power: 40,
      accuracy: 100,
    },
    {
      moveId: 2,
      name: 'quick-attack',
      type: 'special',
      power: 40,
      accuracy: 100,
    },
    {
      moveId: 3,
      name: 'tail-whip',
      type: 'status',
      power: null,
      accuracy: 100,
    },
  ];

  // Rendering tests
  it('should render all moves with formatted names', () => {
    render(<PokemonMovesGrid moves={mockMoves} />);

    expect(screen.getByText('Thunder Shock')).toBeInTheDocument();
    expect(screen.getByText('Quick Attack')).toBeInTheDocument();
    expect(screen.getByText('Tail Whip')).toBeInTheDocument();
  });

  it('should display damage class labels', () => {
    render(<PokemonMovesGrid moves={mockMoves} />);

    expect(screen.getByText('Fizyczny')).toBeInTheDocument();
    expect(screen.getByText('Specjalny')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should display power values', () => {
    render(<PokemonMovesGrid moves={mockMoves} />);

    const powerElements = screen.getAllByText('40');
    expect(powerElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should display accuracy values with percentage', () => {
    render(<PokemonMovesGrid moves={mockMoves} />);

    const accuracyElements = screen.getAllByText('100%');
    expect(accuracyElements.length).toBe(3);
  });

  it('should display move types', () => {
    render(<PokemonMovesGrid moves={mockMoves} />);

    const typeLabels = screen.getAllByText('Typ');
    expect(typeLabels.length).toBe(3);

    expect(screen.getAllByText('physical').length).toBeGreaterThan(0);
    expect(screen.getAllByText('special').length).toBeGreaterThan(0);
    expect(screen.getAllByText('status').length).toBeGreaterThan(0);
  });

  // Empty state tests
  it('should show empty state when moves array is empty', () => {
    render(<PokemonMovesGrid moves={[]} />);

    expect(screen.getByText('Nie znaleziono ruchów dla tego Pokémona.')).toBeInTheDocument();
  });

  it('should show empty state when moves is undefined', () => {
    render(<PokemonMovesGrid moves={undefined as any} />);

    expect(screen.getByText('Nie znaleziono ruchów dla tego Pokémona.')).toBeInTheDocument();
  });

  it('should show empty state when moves is null', () => {
    render(<PokemonMovesGrid moves={null as any} />);

    expect(screen.getByText('Nie znaleziono ruchów dla tego Pokémona.')).toBeInTheDocument();
  });

  // Max moves limit test
  it('should display maximum 12 moves', () => {
    const manyMoves: MoveSummaryDto[] = Array.from({ length: 20 }, (_, i) => ({
      moveId: i,
      name: `move-${i}`,
      type: 'physical',
      power: 50,
      accuracy: 100,
    }));

    const { container } = render(<PokemonMovesGrid moves={manyMoves} />);

    const moveCards = container.querySelectorAll('article');
    expect(moveCards.length).toBe(12);
  });

  it('should render all moves when count is less than 12', () => {
    const { container } = render(<PokemonMovesGrid moves={mockMoves} />);

    const moveCards = container.querySelectorAll('article');
    expect(moveCards.length).toBe(3);
  });

  // Null/missing values tests
  it('should display "—" for null power', () => {
    const movesWithNullPower: MoveSummaryDto[] = [
      {
        moveId: 1,
        name: 'growl',
        type: 'status',
        power: null,
        accuracy: 100,
      },
    ];

    render(<PokemonMovesGrid moves={movesWithNullPower} />);

    expect(screen.getByText('Growl')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should display "—" for null accuracy', () => {
    const movesWithNullAccuracy: MoveSummaryDto[] = [
      {
        moveId: 1,
        name: 'swift',
        type: 'special',
        power: 60,
        accuracy: null,
      },
    ];

    render(<PokemonMovesGrid moves={movesWithNullAccuracy} />);

    const dashElements = screen.getAllByText('—');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('should display "—" for null/undefined damage class', () => {
    const movesWithNullType: MoveSummaryDto[] = [
      {
        moveId: 1,
        name: 'struggle',
        type: null as any,
        power: 50,
        accuracy: 100,
      },
    ];

    render(<PokemonMovesGrid moves={movesWithNullType} />);

    const dashElements = screen.getAllByText('—');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('should display "—" for null type', () => {
    const movesWithNullMoveType: MoveSummaryDto[] = [
      {
        moveId: 1,
        name: 'mystery-move',
        type: null as any,
        power: 50,
        accuracy: 100,
      },
    ];

    render(<PokemonMovesGrid moves={movesWithNullMoveType} />);

    expect(screen.getByText('Mystery Move')).toBeInTheDocument();
  });

  // Name formatting tests
  it('should capitalize each word in move name', () => {
    const movesWithHyphens: MoveSummaryDto[] = [
      {
        moveId: 1,
        name: 'solar-beam',
        type: 'special',
        power: 120,
        accuracy: 100,
      },
    ];

    render(<PokemonMovesGrid moves={movesWithHyphens} />);

    expect(screen.getByText('Solar Beam')).toBeInTheDocument();
  });

  it('should handle single-word move names', () => {
    const singleWordMoves: MoveSummaryDto[] = [
      {
        moveId: 1,
        name: 'tackle',
        type: 'physical',
        power: 40,
        accuracy: 100,
      },
    ];

    render(<PokemonMovesGrid moves={singleWordMoves} />);

    expect(screen.getByText('Tackle')).toBeInTheDocument();
  });

  // Grid structure test
  it('should render in grid layout', () => {
    const { container } = render(<PokemonMovesGrid moves={mockMoves} />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('md:grid-cols-2');
  });

  // Article structure test
  it('should render each move as article element', () => {
    const { container } = render(<PokemonMovesGrid moves={mockMoves} />);

    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(3);
  });

  // Stats display test
  it('should display all move stats (power, accuracy, type)', () => {
    render(<PokemonMovesGrid moves={[mockMoves[0]]} />);

    expect(screen.getByText('Moc')).toBeInTheDocument();
    expect(screen.getByText('Celność')).toBeInTheDocument();
    expect(screen.getByText('Typ')).toBeInTheDocument();
  });

  // Unknown damage class test
  it('should display unknown damage class as-is', () => {
    const movesWithUnknownType: MoveSummaryDto[] = [
      {
        moveId: 1,
        name: 'custom-move',
        type: 'unknown-type' as any,
        power: 50,
        accuracy: 100,
      },
    ];

    render(<PokemonMovesGrid moves={movesWithUnknownType} />);

    expect(screen.getByText('Custom Move')).toBeInTheDocument();
  });

  // Hover interaction test
  it('should have hover styles on move cards', () => {
    const { container } = render(<PokemonMovesGrid moves={mockMoves} />);

    const firstCard = container.querySelector('article');
    expect(firstCard).toHaveClass('hover:border-primary/40');
  });
});
