import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/stores/use-session-store";
import { addFavoriteToApi, checkIsFavorite, deleteFavoriteFromApi, FavoritesApiError } from "@/lib/favorites/api";

export interface PokemonFavoriteActionProps {
  pokemonId: number;
  pokemonName: string;
}

type FavoriteState = "unknown" | "checking" | "favorite" | "not-favorite";
type OperationState = "idle" | "adding" | "removing";

export function PokemonFavoriteAction({ pokemonId, pokemonName }: PokemonFavoriteActionProps) {
  const status = useSessionStore((state) => state.status);
  const isAuthenticated = status === "authenticated";
  const [loginHref, setLoginHref] = useState("/auth/login");
  const [favoriteState, setFavoriteState] = useState<FavoriteState>("unknown");
  const [operationState, setOperationState] = useState<OperationState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams({
      redirectTo: window.location.pathname + window.location.search,
    });
    setLoginHref(`/auth/login?${params.toString()}`);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteState("unknown");
      return;
    }

    const checkFavoriteStatus = async () => {
      setFavoriteState("checking");
      setError(null);

      try {
        const isFav = await checkIsFavorite(pokemonId);
        setFavoriteState(isFav ? "favorite" : "not-favorite");
      } catch (err) {
        console.error("[PokemonFavoriteAction] Failed to check favorite status:", err);
        setFavoriteState("not-favorite");
        if (err instanceof FavoritesApiError && err.code !== 401) {
          setError("Nie udało się sprawdzić statusu ulubionego.");
        }
      }
    };

    checkFavoriteStatus();
  }, [isAuthenticated, pokemonId]);

  const handleToggleFavorite = useCallback(async () => {
    if (operationState !== "idle") {
      return;
    }

    const isCurrentlyFavorite = favoriteState === "favorite";
    setOperationState(isCurrentlyFavorite ? "removing" : "adding");
    setError(null);

    try {
      if (isCurrentlyFavorite) {
        await deleteFavoriteFromApi(pokemonId);
        setFavoriteState("not-favorite");
      } else {
        await addFavoriteToApi(pokemonId);
        setFavoriteState("favorite");
      }
    } catch (err) {
      console.error("[PokemonFavoriteAction] Operation failed:", err);

      if (err instanceof FavoritesApiError) {
        if (err.code === 401) {
          window.location.href = loginHref;
          return;
        }
        setError(err.message);
      } else {
        setError("Nie udało się wykonać operacji. Spróbuj ponownie.");
      }
    } finally {
      setOperationState("idle");
    }
  }, [favoriteState, operationState, pokemonId, loginHref]);

  if (!isAuthenticated) {
    return (
      <Button
        asChild
        size="sm"
        variant="secondary"
        className="gap-2 rounded-full border border-white/10 bg-white/10 text-white shadow-md shadow-black/20 backdrop-blur transition hover:bg-white/20 dark:bg-white/10 dark:text-white"
      >
        <a
          href={loginHref}
          aria-label={`Dodaj ${pokemonName} do ulubionych – wymagane logowanie`}
          data-pokemon-id={pokemonId}
          data-testid={`favorite-login-prompt-${pokemonId}`}
        >
          <Heart className="size-4" />
          Dodaj do ulubionych
        </a>
      </Button>
    );
  }

  const isLoading = operationState !== "idle" || favoriteState === "checking";
  const isFavorite = favoriteState === "favorite";
  const buttonText = isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych";
  const ariaLabel = error ? `${buttonText} – ${error}` : isLoading ? `${buttonText} – ładowanie...` : buttonText;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={isLoading}
        onClick={handleToggleFavorite}
        aria-label={ariaLabel}
        title={error || undefined}
        className="gap-2 rounded-full border border-white/10 bg-white/10 text-white shadow-md shadow-black/20 backdrop-blur transition hover:bg-white/20 disabled:opacity-60 dark:bg-white/10 dark:text-white"
        data-pokemon-id={pokemonId}
        data-testid={`favorite-toggle-button-${pokemonId}`}
        data-is-favorite={isFavorite}
        data-is-loading={isLoading}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" data-testid={`favorite-action-loading-${pokemonId}`} />
        ) : (
          <Heart className="size-4" fill={isFavorite ? "currentColor" : "none"} />
        )}
        {buttonText}
      </Button>
      {error && (
        <p className="text-xs text-red-400" role="alert" data-testid={`favorite-action-error-${pokemonId}`}>
          {error}
        </p>
      )}
    </div>
  );
}
