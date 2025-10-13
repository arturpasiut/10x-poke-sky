import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/stores/use-session-store";

export interface PokemonFavoriteActionProps {
  pokemonId: number;
  pokemonName: string;
}

export function PokemonFavoriteAction({ pokemonId, pokemonName }: PokemonFavoriteActionProps) {
  const status = useSessionStore((state) => state.status);
  const isAuthenticated = status === "authenticated";
  const [loginHref, setLoginHref] = useState("/auth/login");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams({
      redirectTo: window.location.pathname + window.location.search,
    });
    setLoginHref(`/auth/login?${params.toString()}`);
  }, []);

  const actionLabel = useMemo(
    () => `Dodaj ${pokemonName} do ulubionych`,
    [pokemonName]
  );

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
          aria-label={`${actionLabel} – wymagane logowanie`}
          data-pokemon-id={pokemonId}
        >
          <Heart className="size-4" />
          Dodaj do ulubionych
        </a>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled
      title="Funkcja ulubionych będzie dostępna w fazie 6."
      className="gap-2 rounded-full border border-white/10 bg-white/10 text-white opacity-80 shadow-md shadow-black/15 backdrop-blur"
      data-pokemon-id={pokemonId}
    >
      <Heart className="size-4" />
      Dodaj do ulubionych
      <span className="sr-only">Funkcja ulubionych będzie dostępna w fazie 6.</span>
    </Button>
  );
}
