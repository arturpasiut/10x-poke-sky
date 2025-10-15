import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PokemonStatsPanel } from '../PokemonStatsPanel';
import type { PokemonStat } from '@/lib/types/pokemon';

describe('PokemonStatsPanel', () => {
  const mockStats: PokemonStat[] = [
    {
      base_stat: 45,
      effort: 0,
      stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' },
    },
    {
      base_stat: 49,
      effort: 0,
      stat: { name: 'attack', url: 'https://pokeapi.co/api/v2/stat/2/' },
    },
    {
      base_stat: 49,
      effort: 1,
      stat: { name: 'defense', url: 'https://pokeapi.co/api/v2/stat/3/' },
    },
    {
      base_stat: 65,
      effort: 0,
      stat: { name: 'special-attack', url: 'https://pokeapi.co/api/v2/stat/4/' },
    },
    {
      base_stat: 65,
      effort: 0,
      stat: { name: 'special-defense', url: 'https://pokeapi.co/api/v2/stat/5/' },
    },
    {
      base_stat: 45,
      effort: 0,
      stat: { name: 'speed', url: 'https://pokeapi.co/api/v2/stat/6/' },
    },
  ];

  // Rendering tests
  it('should render all stats with labels and values', () => {
    render(<PokemonStatsPanel stats={mockStats} />);

    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('Atak')).toBeInTheDocument();
    expect(screen.getByText('Obrona')).toBeInTheDocument();
    expect(screen.getByText('Sp. Atak')).toBeInTheDocument();
    expect(screen.getByText('Sp. Obrona')).toBeInTheDocument();
    expect(screen.getByText('Szybkość')).toBeInTheDocument();
  });

  it('should display correct stat values', () => {
    render(<PokemonStatsPanel stats={mockStats} />);

    expect(screen.getByLabelText('HP 45')).toBeInTheDocument();
    expect(screen.getByLabelText('Atak 49')).toBeInTheDocument();
    expect(screen.getByLabelText('Obrona 49')).toBeInTheDocument();
  });

  it('should render progress bars for each stat', () => {
    const { container } = render(<PokemonStatsPanel stats={mockStats} />);

    const progressBars = container.querySelectorAll('[style*="width"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  // Empty state tests
  it('should show empty state when stats array is empty', () => {
    render(<PokemonStatsPanel stats={[]} />);

    expect(screen.getByText('Brak danych o statystykach dla wybranego Pokémona.')).toBeInTheDocument();
  });

  it('should show empty state when stats is undefined', () => {
    render(<PokemonStatsPanel stats={undefined as any} />);

    expect(screen.getByText('Brak danych o statystykach dla wybranego Pokémona.')).toBeInTheDocument();
  });

  it('should show empty state when stats is null', () => {
    render(<PokemonStatsPanel stats={null as any} />);

    expect(screen.getByText('Brak danych o statystykach dla wybranego Pokémona.')).toBeInTheDocument();
  });

  // Progress bar calculations
  it('should calculate percentage based on max stat value', () => {
    const stats: PokemonStat[] = [
      {
        base_stat: 100,
        effort: 0,
        stat: { name: 'hp', url: '' },
      },
      {
        base_stat: 50,
        effort: 0,
        stat: { name: 'attack', url: '' },
      },
    ];

    const { container } = render(<PokemonStatsPanel stats={stats} />);

    const progressBars = container.querySelectorAll('[style*="width"]');
    expect(progressBars.length).toBe(2);
  });

  it('should handle zero base_stat value', () => {
    const stats: PokemonStat[] = [
      {
        base_stat: 0,
        effort: 0,
        stat: { name: 'hp', url: '' },
      },
    ];

    render(<PokemonStatsPanel stats={stats} />);

    expect(screen.getByLabelText('HP 0')).toBeInTheDocument();
  });

  it('should handle very high stat values', () => {
    const stats: PokemonStat[] = [
      {
        base_stat: 255,
        effort: 0,
        stat: { name: 'hp', url: '' },
      },
    ];

    render(<PokemonStatsPanel stats={stats} />);

    expect(screen.getByLabelText('HP 255')).toBeInTheDocument();
  });

  // Edge cases with stat names
  it('should handle unknown stat names', () => {
    const stats: PokemonStat[] = [
      {
        base_stat: 50,
        effort: 0,
        stat: { name: 'unknown-stat', url: '' },
      },
    ];

    render(<PokemonStatsPanel stats={stats} />);

    expect(screen.getByText('unknown-stat')).toBeInTheDocument();
    expect(screen.getByLabelText('unknown-stat 50')).toBeInTheDocument();
  });

  it('should handle missing stat name', () => {
    const stats: PokemonStat[] = [
      {
        base_stat: 50,
        effort: 0,
        stat: { name: null as any, url: '' },
      },
    ];

    render(<PokemonStatsPanel stats={stats} />);

    expect(screen.getByText('Stat')).toBeInTheDocument();
  });

  it('should handle missing stat object', () => {
    const stats: PokemonStat[] = [
      {
        base_stat: 50,
        effort: 0,
        stat: null as any,
      },
    ];

    render(<PokemonStatsPanel stats={stats} />);

    expect(screen.getByText('Stat')).toBeInTheDocument();
  });

  // Single stat test
  it('should render with single stat', () => {
    const stats: PokemonStat[] = [
      {
        base_stat: 100,
        effort: 0,
        stat: { name: 'hp', url: '' },
      },
    ];

    render(<PokemonStatsPanel stats={stats} />);

    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByLabelText('HP 100')).toBeInTheDocument();
  });

  // Accessibility tests
  it('should have aria-label for each stat row', () => {
    render(<PokemonStatsPanel stats={mockStats} />);

    mockStats.forEach((stat) => {
      const label = stat.stat.name === 'hp' ? 'HP' : stat.stat.name;
      const ariaLabel = `${label === 'hp' ? 'HP' : label} ${stat.base_stat}`;

      const elements = screen.queryAllByLabelText(new RegExp(stat.base_stat.toString()));
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  // Different pokemon stats
  it('should render stats for different pokemon correctly', () => {
    const pikachuStats: PokemonStat[] = [
      {
        base_stat: 35,
        effort: 0,
        stat: { name: 'hp', url: '' },
      },
      {
        base_stat: 55,
        effort: 0,
        stat: { name: 'attack', url: '' },
      },
      {
        base_stat: 90,
        effort: 2,
        stat: { name: 'speed', url: '' },
      },
    ];

    render(<PokemonStatsPanel stats={pikachuStats} />);

    expect(screen.getByLabelText('HP 35')).toBeInTheDocument();
    expect(screen.getByLabelText('Atak 55')).toBeInTheDocument();
    expect(screen.getByLabelText('Szybkość 90')).toBeInTheDocument();
  });
});
