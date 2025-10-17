import { useCallback, useEffect, useMemo, useState } from "react";
import { HeartOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/pokemon/ListSkeleton";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import {
  deleteFavoriteFromApi,
  fetchFavoritesList,
  FavoritesApiError,
  type FavoritesListParams,
} from "@/lib/favorites/api";
import type { FavoritePokemonViewModel } from "@/lib/favorites/transformers";

type RequestStatus = "idle" | "loading" | "success" | "error";

interface RemovalState {
  status: "idle" | "removing" | "error";
  error?: string;
}

const DEFAULT_REMOVAL_STATE: RemovalState = { status: "idle" };

const DEFAULT_QUERY: FavoritesListParams = {
  page: 1,
  pageSize: 20,
  sort: "createdAt",
  order: "desc",
};

export default function FavoritesView() {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [items, setItems] = useState<FavoritePokemonViewModel[]>([]);
  const [error, setError] = useState<FavoritesApiError | null>(null);
  const [loginHref, setLoginHref] = useState<string>("/auth/login");
  const [removalMap, setRemovalMap] = useState<Record<number, RemovalState>>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams({
      redirectTo: window.location.pathname + window.location.search,
    });
    setLoginHref(`/auth/login?${params.toString()}`);
  }, []);

  const loadFavorites = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const { items: viewModels } = await fetchFavoritesList(DEFAULT_QUERY);
      setItems(viewModels);
      setStatus("success");
    } catch (unknownError) {
      const apiError =
        unknownError instanceof FavoritesApiError
          ? unknownError
          : new FavoritesApiError("Nie udało się pobrać ulubionych. Spróbuj ponownie później.", {
              code: 0,
              details: unknownError instanceof Error ? unknownError.message : undefined,
            });
      setError(apiError);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const handleRetry = useCallback(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const setRemovalState = useCallback((pokemonId: number, state: RemovalState) => {
    setRemovalMap((prev) => ({
      ...prev,
      [pokemonId]: state,
    }));
  }, []);

  const handleRemove = useCallback(
    async (pokemonId: number) => {
      const current = removalMap[pokemonId] ?? DEFAULT_REMOVAL_STATE;
      if (current.status === "removing") {
        return;
      }

      setRemovalState(pokemonId, { status: "removing" });

      try {
        await deleteFavoriteFromApi(pokemonId);
        setItems((prev) => prev.filter((item) => item.pokemonId !== pokemonId));
        setRemovalState(pokemonId, { status: "idle" });
      } catch (unknownError) {
        const message =
          unknownError instanceof FavoritesApiError
            ? unknownError.message
            : unknownError instanceof Error
              ? unknownError.message
              : "Nie udało się usunąć ulubionego.";
        setRemovalState(pokemonId, { status: "error", error: message });
      }
    },
    [removalMap, setRemovalState]
  );

  const hasFavorites = items.length > 0;

  const removalEntries = useMemo(() => removalMap, [removalMap]);

  if (status === "loading") {
    return (
      <div data-testid="favorites-loading">
        <ListSkeleton />
      </div>
    );
  }

  if (status === "error" && error) {
    const requiresAuth = error.code === 401;

    return (
      <section
        className="flex flex-col items-center gap-6 rounded-3xl border border-white/5 bg-[#101722] p-10 text-center shadow-lg shadow-black/30"
        data-testid="favorites-error-state"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Nie udało się załadować ulubionych</h2>
          <p className="text-muted-foreground" data-testid="favorites-error-message">
            {error.message}
          </p>
          {error.details ? <p className="text-sm text-muted-foreground/80">{error.details}</p> : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleRetry} variant="secondary" data-testid="favorites-retry-button">
            Spróbuj ponownie
          </Button>
          {requiresAuth ? (
            <Button asChild>
              <a href={loginHref} data-testid="favorites-login-link">
                Zaloguj się
              </a>
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  if (status === "success" && !hasFavorites) {
    return (
      <section
        className="flex flex-col items-center gap-6 rounded-3xl border border-white/5 bg-[#101722] p-12 text-center shadow-lg shadow-black/25"
        data-testid="favorites-empty-state"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <HeartOff className="size-7 text-white/80" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Brak ulubionych Pokémonów</h2>
          <p className="text-base text-white/80" data-testid="favorites-empty-message">
            Dodaj Pokémony do ulubionych, a pojawią się na tej liście. Odkrywaj Pokédex lub wykorzystaj asystenta AI.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary">
            <a href="/pokemon" data-testid="favorites-browse-link">
              Przejdź do Pokédexu
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href="/ai" data-testid="favorites-ai-link">
              Zaproś asystenta AI
            </a>
          </Button>
        </div>
      </section>
    );
  }

  if (status !== "success") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        role="feed"
        aria-live="polite"
        aria-busy={false}
        data-testid="favorites-grid"
      >
        {items.map((pokemon) => {
          const removalState = removalEntries[pokemon.pokemonId] ?? DEFAULT_REMOVAL_STATE;
          const isRemoving = removalState.status === "removing";

          return (
            <div key={pokemon.pokemonId} className="group relative" data-testid={`favorite-card-${pokemon.pokemonId}`}>
              <PokemonCard pokemon={pokemon} />
              <div className="pointer-events-none absolute inset-0 rounded-3xl border border-transparent transition group-hover:border-white/20" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-col items-stretch gap-2">
                <Button
                  type="button"
                  size="default"
                  variant="secondary"
                  className="pointer-events-auto gap-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void handleRemove(pokemon.pokemonId);
                  }}
                  disabled={isRemoving}
                  data-testid={`favorite-remove-button-${pokemon.pokemonId}`}
                >
                  {isRemoving ? <Loader2 className="size-4 animate-spin" /> : <HeartOff className="size-4" />}
                  Usuń z ulubionych
                </Button>
                {removalState.status === "error" && removalState.error ? (
                  <p
                    className="pointer-events-none rounded-md bg-black/70 px-3 py-2 text-xs text-red-300 shadow-lg"
                    data-testid={`favorite-remove-error-${pokemon.pokemonId}`}
                  >
                    {removalState.error}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
