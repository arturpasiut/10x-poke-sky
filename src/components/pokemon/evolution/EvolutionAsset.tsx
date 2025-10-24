import { memo, useEffect, useMemo, useState } from "react";

import clsx from "clsx";

import type { EvolutionAssetPreference, EvolutionAssetSources } from "@/lib/evolution/types";

const FALLBACK_DATA_URI =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-labelledby="title"><title>Brak obrazka Pokémona</title><rect width="160" height="160" rx="24" ry="24" fill="#0f172a"/><path d="M80 18a62 62 0 1062 62A62.07 62.07 0 0080 18zm0 12a50 50 0 0148.8 40H96a16 16 0 10-32 0H31.2A50 50 0 0180 30zm0 100a50 50 0 01-48.8-40H64a16 16 0 0032 0h32.8A50 50 0 0180 130z" fill="#1e293b"/></svg>`
  );

type ResolvedAssetType = "gif" | "sprite" | "artwork" | "fallback" | "placeholder";

interface ResolvedAsset {
  url: string;
  type: ResolvedAssetType;
}

export interface EvolutionAssetProps {
  pokemonName: string;
  pokemonId: number;
  sources: EvolutionAssetSources;
  preference: EvolutionAssetPreference;
  className?: string;
}

function resolveAsset(sources: EvolutionAssetSources, preference: EvolutionAssetPreference): ResolvedAsset {
  const { gif, sprite, officialArtwork, fallback } = sources;

  const candidates: ResolvedAsset[] =
    preference === "gif"
      ? [
          gif ? { url: gif, type: "gif" as const } : null,
          sprite ? { url: sprite, type: "sprite" as const } : null,
          officialArtwork ? { url: officialArtwork, type: "artwork" as const } : null,
          fallback ? { url: fallback, type: "fallback" as const } : null,
        ]
      : [
          sprite ? { url: sprite, type: "sprite" as const } : null,
          gif ? { url: gif, type: "gif" as const } : null,
          officialArtwork ? { url: officialArtwork, type: "artwork" as const } : null,
          fallback ? { url: fallback, type: "fallback" as const } : null,
        ];

  const resolved = candidates.find(Boolean);
  if (resolved) {
    return resolved;
  }

  return {
    url: FALLBACK_DATA_URI,
    type: "placeholder",
  };
}

function Component({ pokemonName, pokemonId, sources, preference, className }: EvolutionAssetProps) {
  const resolved = useMemo(() => resolveAsset(sources, preference), [sources, preference]);
  const fallbackResolved = useMemo<ResolvedAsset>(() => {
    if (resolved.type === "fallback" || resolved.type === "placeholder") {
      return resolved;
    }
    if (sources.fallback) {
      return { url: sources.fallback, type: "fallback" };
    }
    return { url: FALLBACK_DATA_URI, type: "placeholder" };
  }, [resolved, sources.fallback]);

  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [overrideAsset, setOverrideAsset] = useState<ResolvedAsset | null>(null);

  useEffect(() => {
    setStatus("loading");
    setOverrideAsset(null);
  }, [resolved.url]);

  const displayAsset = overrideAsset ?? resolved;

  const showFallbackNotice = preference === "gif" && displayAsset.type !== "gif";

  return (
    <div
      className={clsx(
        "relative mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-white/10 via-transparent to-white/20 shadow-inner",
        className
      )}
    >
      <div className="absolute inset-0 bg-white/5 blur-2xl" aria-hidden="true" />
      {status !== "loaded" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      )}

      <img
        key={displayAsset.url}
        src={displayAsset.url}
        alt={`${pokemonName} graphic`}
        loading="lazy"
        onLoad={() => setStatus("loaded")}
        onError={() => {
          if (overrideAsset) {
            setStatus("error");
            return;
          }
          if (displayAsset.type !== fallbackResolved.type || displayAsset.url !== fallbackResolved.url) {
            setOverrideAsset(fallbackResolved);
            setStatus("loading");
            return;
          }
          setStatus("error");
        }}
        className={clsx(
          "relative z-10 h-32 w-32 object-contain drop-shadow-[0_18px_25px_rgba(18,17,35,0.45)] transition-transform duration-500",
          status === "loaded" ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        data-testid={`evolution-asset-${pokemonId}`}
      />

      {showFallbackNotice && (
        <span className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/80 shadow-lg">
          Brak animacji – wyświetlamy sprite
        </span>
      )}
    </div>
  );
}

export const EvolutionAsset = memo(Component);
