import { useCallback, useEffect, useState } from "react";

import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { Button } from "@/components/ui/button";
import { usePokemonList } from "@/lib/cache/usePokemonListCache";
import type { PokemonSummaryDto } from "@/types";

const PAGE_SIZE = 20;

export interface PokemonGridProps {
  search: string;
  types: string[];
  generation: string;
  region: string;
}

export function PokemonGrid({ search, types, generation, region }: PokemonGridProps) {
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<PokemonSummaryDto[]>([]);
  const [hasNext, setHasNext] = useState(true);

  const { data, isLoading, error, fromCache, refresh } = usePokemonList({
    limit: PAGE_SIZE,
    offset,
    search,
    types,
    generation,
    region,
  });

  useEffect(() => {
    setOffset(0);
    setItems([]);
  }, [search, types, generation, region]);

  useEffect(() => {
    if (!data) {
      return;
    }

    setItems((prev) => {
      if (offset === 0) {
        return data.items;
      }

      const existingIds = new Set(prev.map((item) => item.pokemonId));
      const merged = [...prev];
      data.items.forEach((item) => {
        if (!existingIds.has(item.pokemonId)) {
          merged.push(item);
        }
      });
      return merged;
    });
    setHasNext(data.hasNext);
  }, [data, offset]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasNext) return;
    setOffset((prev) => prev + PAGE_SIZE);
  }, [hasNext, isLoading]);

  const handleRefresh = useCallback(async () => {
    setOffset(0);
    setItems([]);
    await refresh();
  }, [refresh]);

  return (
    <section className="mt-10 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Pokédex</h2>
          <p className="text-sm text-muted-foreground">
            {fromCache ? "Wczytano z pamięci lokalnej" : "Aktualne dane z Supabase"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
            Odśwież
          </Button>
        </div>
      </header>

      {error ? (
        <div className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <p>Nie udało się pobrać listy Pokémonów.</p>
          <p className="text-sm opacity-80">{error}</p>
          <p className="text-sm">
            W międzyczasie możesz spróbować rozpoznać Pokémona w&nbsp;
            <a href="/ai" className="font-semibold text-destructive underline-offset-4 hover:underline">
              czacie AI
            </a>
            .
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((pokemon) => (
          <PokemonCard key={pokemon.pokemonId} pokemon={pokemon} />
        ))}

        {isLoading && items.length === 0 ? <SkeletonGrid /> : null}
      </div>

      {items.length === 0 && !isLoading && !error ? (
        <div className="space-y-3 rounded-xl border border-border/40 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          <p>Brak wyników dla wybranych kryteriów wyszukiwania.</p>
          <p>
            Spróbuj zmienić filtry lub skorzystaj z&nbsp;
            <a href="/ai" className="font-semibold text-primary underline-offset-4 hover:underline">
              czatu AI
            </a>
            , opisując Pokémona, którego szukasz.
          </p>
        </div>
      ) : (
        <footer className="flex justify-center">
          {hasNext ? (
            <Button onClick={handleLoadMore} disabled={isLoading} variant="secondary">
              {isLoading ? "Ładowanie..." : "Pokaż więcej"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">To wszystkie wyniki dla tej sekcji.</p>
          )}
        </footer>
      )}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-64 animate-pulse rounded-2xl bg-muted/60 border border-border/30" />
      ))}
    </>
  );
}
