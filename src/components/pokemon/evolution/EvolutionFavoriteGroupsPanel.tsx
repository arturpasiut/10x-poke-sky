import { memo, useEffect, useMemo, useState } from "react";

import clsx from "clsx";

import type { EvolutionAssetPreference, EvolutionChainDto } from "@/lib/evolution/types";
import { fetchEvolutionFavoriteGroups, deleteEvolutionFavoriteGroup, FavoritesApiError } from "@/lib/favorites/api";
import { fetchEvolutionChainFromEdge } from "@/lib/api/evolution-service";
import { useSessionStore } from "@/lib/stores/use-session-store";

interface EvolutionFavoriteGroupsPanelProps {
  className?: string;
  highlightChainId?: string | null;
  assetPreference?: EvolutionAssetPreference | null;
  initialIsAuthenticated?: boolean;
}

interface GroupViewModel {
  id: string;
  chainId: string;
  branchId: string;
  pokemonIds: number[];
  createdAt: string;
  chain?: EvolutionChainDto;
}

type LoadState = "idle" | "loading" | "error" | "success";

const formatDate = (value: string) => {
  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch {
    return value;
  }
};

function Component({
  className,
  highlightChainId = null,
  assetPreference,
  initialIsAuthenticated = false,
}: EvolutionFavoriteGroupsPanelProps) {
  const sessionStatus = useSessionStore((state) => state.status);
  const isAuthenticated = initialIsAuthenticated || sessionStatus === "authenticated";

  const [groups, setGroups] = useState<GroupViewModel[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setGroups([]);
      setLoadState("idle");
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setLoadState("loading");
      setError(null);

      try {
        const items = await fetchEvolutionFavoriteGroups();
        if (cancelled) return;

        const uniqueChainIds = Array.from(new Set(items.map((item) => item.chainId)));
        const chainEntries = await Promise.all(
          uniqueChainIds.map(async (chainId) => {
            try {
              const response = await fetchEvolutionChainFromEdge({ chainId });
              return [chainId, response.data] as const;
            } catch {
              return [chainId, null] as const;
            }
          })
        );

        const chains = new Map<string, EvolutionChainDto | null>(chainEntries);

        const viewModels: GroupViewModel[] = items.map((group) => ({
          ...group,
          chain: chains.get(group.chainId) ?? undefined,
        }));

        setGroups(viewModels);
        setLoadState("success");
      } catch (fetchError) {
        if (cancelled) return;
        console.error("[EvolutionFavoriteGroupsPanel] Failed to load groups", fetchError);
        setError(
          fetchError instanceof FavoritesApiError ? fetchError.message : "Nie udało się pobrać zapisanych łańcuchów."
        );
        setLoadState("error");
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const highlightedGroups = useMemo(() => {
    if (!highlightChainId) {
      return groups;
    }

    return [
      ...groups.filter((group) => group.chainId === highlightChainId),
      ...groups.filter((group) => group.chainId !== highlightChainId),
    ];
  }, [groups, highlightChainId]);

  const handleRemove = async (chainId: string, branchId: string) => {
    try {
      await deleteEvolutionFavoriteGroup(chainId, branchId);
      setGroups((prev) => prev.filter((group) => !(group.chainId === chainId && group.branchId === branchId)));
    } catch (err) {
      console.error("[EvolutionFavoriteGroupsPanel] Failed to delete group", err);
      setError(
        err instanceof FavoritesApiError
          ? err.message
          : "Nie udało się usunąć zapisanego łańcucha. Spróbuj ponownie później."
      );
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className={clsx("space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl", className)}>
      <header className="flex flex-col gap-2 text-white">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Twoje zapisane drużyny</h2>
          <a
            href="/auth/login"
            className="text-sm text-white/60 underline-offset-4 transition hover:underline"
            hidden={isAuthenticated}
          >
            Zaloguj się, aby zapisywać łańcuchy
          </a>
        </div>
        <p className="text-sm text-white/60">
          Przechowujemy ulubione gałęzie łańcuchów, abyś mógł szybko wrócić do preferowanych zestawów.
        </p>
      </header>

      {loadState === "loading" ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/10"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
      ) : null}

      {loadState === "success" && highlightedGroups.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/70">
          Nie zapisałeś jeszcze żadnej drużyny. Wybierz gałąź łańcucha i skorzystaj z przycisku „Zapisz drużynę”, aby ją
          dodać.
        </p>
      ) : null}

      {highlightedGroups.length > 0 ? (
        <ul className="space-y-4">
          {highlightedGroups.map((group) => {
            const chain = group.chain;
            const branchLabel =
              group.branchId && chain
                ? (chain.branches.find((branch) => branch.id === group.branchId)?.label ?? "Wybrana gałąź")
                : "Pełen łańcuch";

            const pokemonNames =
              chain?.stages.filter((stage) => group.pokemonIds.includes(stage.pokemonId)).map((stage) => stage.name) ??
              group.pokemonIds.map((id) => `#${String(id).padStart(3, "0")}`);

            const navigateUrl = `/evolutions?chainId=${group.chainId}${group.branchId ? `&branchId=${group.branchId}` : ""}`;

            const isHighlighted = highlightChainId === group.chainId;

            return (
              <li
                key={`${group.chainId}-${group.branchId}`}
                className={clsx(
                  "flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-white shadow-inner",
                  isHighlighted && "border-primary/60 bg-primary/20"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-white/60">Łańcuch {group.chainId}</p>
                    <h3 className="text-lg font-semibold text-white">{branchLabel}</h3>
                    <p className="text-xs text-white/70">Zapisano: {formatDate(group.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition hover:bg-white/20"
                      href={navigateUrl}
                    >
                      Otwórz w evolutions →
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemove(group.chainId, group.branchId)}
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:bg-white/20"
                    >
                      Usuń
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                  {pokemonNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {assetPreference ? (
        <p className="text-xs text-white/50">
          Preferencja multimediów: {assetPreference === "gif" ? "Animowane GIF-y" : "Sprite Pokédexu"} (zapisywana w
          profilu)
        </p>
      ) : null}
    </section>
  );
}

export const EvolutionFavoriteGroupsPanel = memo(Component);
