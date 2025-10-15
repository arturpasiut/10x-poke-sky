import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { PokemonFavoriteAction } from '../PokemonFavoriteAction';
import * as favoritesApi from '@/lib/favorites/api';
import * as sessionStore from '@/lib/stores/use-session-store';

vi.mock('@/lib/favorites/api');
vi.mock('@/lib/stores/use-session-store');

describe('PokemonFavoriteAction', () => {
  const defaultProps = {
    pokemonId: 25,
    pokemonName: 'Pikachu',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { pathname: '/pokemon/pikachu', search: '', href: '' };
  });

  // Unauthenticated state tests
  it('should render login link when user is not authenticated', () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('unauthenticated' as any);

    render(<PokemonFavoriteAction {...defaultProps} />);

    const link = screen.getByRole('link', { name: /Dodaj Pikachu do ulubionych – wymagane logowanie/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/auth/login?redirectTo=%2Fpokemon%2Fpikachu');
  });

  it('should show heart icon when unauthenticated', () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('unauthenticated' as any);

    const { container } = render(<PokemonFavoriteAction {...defaultProps} />);

    const heart = container.querySelector('svg');
    expect(heart).toBeInTheDocument();
  });

  it('should include pokemon ID in data attribute when unauthenticated', () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('unauthenticated' as any);

    render(<PokemonFavoriteAction {...defaultProps} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-pokemon-id', '25');
  });

  // Authenticated state - checking favorite status
  it('should check favorite status when authenticated', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(favoritesApi.checkIsFavorite).toHaveBeenCalledWith(25);
    });
  });

  it('should render button when authenticated', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('should show "Dodaj do ulubionych" when pokemon is not favorite', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dodaj do ulubionych' })).toBeInTheDocument();
    });
  });

  it('should show "Usuń z ulubionych" when pokemon is favorite', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(true);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Usuń z ulubionych' })).toBeInTheDocument();
    });
  });

  it('should show filled heart when pokemon is favorite', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(true);

    const { container } = render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      const heart = container.querySelector('svg[fill="currentColor"]');
      expect(heart).toBeInTheDocument();
    });
  });

  it('should show empty heart when pokemon is not favorite', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);

    const { container } = render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      const heart = container.querySelector('svg[fill="none"]');
      expect(heart).toBeInTheDocument();
    });
  });

  // Adding to favorites
  it('should call addFavoriteToApi when adding to favorites', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);
    vi.mocked(favoritesApi.addFavoriteToApi).mockResolvedValue(undefined);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dodaj do ulubionych' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(favoritesApi.addFavoriteToApi).toHaveBeenCalledWith(25);
    });
  });

  it('should update button text after adding to favorites', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);
    vi.mocked(favoritesApi.addFavoriteToApi).mockResolvedValue(undefined);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dodaj do ulubionych' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Usuń z ulubionych' })).toBeInTheDocument();
    });
  });

  // Removing from favorites
  it('should call deleteFavoriteFromApi when removing from favorites', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(true);
    vi.mocked(favoritesApi.deleteFavoriteFromApi).mockResolvedValue(undefined);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Usuń z ulubionych' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(favoritesApi.deleteFavoriteFromApi).toHaveBeenCalledWith(25);
    });
  });

  it('should update button text after removing from favorites', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(true);
    vi.mocked(favoritesApi.deleteFavoriteFromApi).mockResolvedValue(undefined);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Usuń z ulubionych' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dodaj do ulubionych' })).toBeInTheDocument();
    });
  });

  // Loading states
  it('should disable button while checking favorite status', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(false), 100))
    );

    render(<PokemonFavoriteAction {...defaultProps} />);

    const button = await screen.findByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show loader icon while operation is in progress', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);
    vi.mocked(favoritesApi.addFavoriteToApi).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
    );

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dodaj do ulubionych' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    // Button should be disabled during operation
    expect(button).toBeDisabled();
  });

  // Error handling
  it('should display error when check fails', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    const error = { code: 500, message: 'Failed to check' };
    Object.setPrototypeOf(error, favoritesApi.FavoritesApiError.prototype);
    vi.mocked(favoritesApi.checkIsFavorite).mockRejectedValue(error);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // Error message is displayed for non-401 check failures
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Nie udało się sprawdzić statusu ulubionego.')).toBeInTheDocument();
    });
  });

  it('should display error message when add operation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);

    const error = { code: 500, message: 'Failed to add' };
    Object.setPrototypeOf(error, favoritesApi.FavoritesApiError.prototype);
    vi.mocked(favoritesApi.addFavoriteToApi).mockRejectedValue(error);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dodaj do ulubionych' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to add')).toBeInTheDocument();
    });
  });

  it('should display error message when remove operation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(true);

    const error = { code: 500, message: 'Failed to remove' };
    Object.setPrototypeOf(error, favoritesApi.FavoritesApiError.prototype);
    vi.mocked(favoritesApi.deleteFavoriteFromApi).mockRejectedValue(error);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Usuń z ulubionych' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to remove')).toBeInTheDocument();
    });
  });

  // Accessibility
  it('should have proper aria-label', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Dodaj do ulubionych' });
      expect(button).toHaveAttribute('aria-label', 'Dodaj do ulubionych');
    });
  });

  it('should include pokemon ID in button data attribute', async () => {
    vi.mocked(sessionStore.useSessionStore).mockReturnValue('authenticated' as any);
    vi.mocked(favoritesApi.checkIsFavorite).mockResolvedValue(false);

    render(<PokemonFavoriteAction {...defaultProps} />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-pokemon-id', '25');
    });
  });
});
