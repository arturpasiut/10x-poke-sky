import { memo, useMemo } from "react";

import clsx from "clsx";

import { getTypeBadgeClass, getTypeGradientClasses, getTypeLabel } from "@/lib/pokemon/filters";
import type { EvolutionAssetPreference, EvolutionStageDto, EvolutionRequirementDto } from "@/lib/evolution/types";
import { EvolutionAsset } from "@/components/pokemon/evolution/EvolutionAsset";

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Atak",
  defense: "Obrona",
  "special-attack": "Sp. Atak",
  "special-defense": "Sp. Obrona",
  speed: "Szybkość",
};

function formatRequirement(requirement: EvolutionRequirementDto) {
  if (requirement.detail) {
    return `${requirement.summary} – ${requirement.detail}`;
  }
  return requirement.summary;
}

export interface EvolutionStageCardProps {
  stage: EvolutionStageDto;
  assetPreference: EvolutionAssetPreference;
  isActive?: boolean;
  showStatDiffs?: boolean;
  onFocus?: (pokemonId: number) => void;
}

function Component({
  stage,
  assetPreference,
  isActive = false,
  showStatDiffs = false,
  onFocus,
}: EvolutionStageCardProps) {
  const gradientClass = useMemo(() => getTypeGradientClasses(stage.types), [stage.types]);
  const typeBadges = useMemo(
    () =>
      stage.types.map((type) => ({
        value: type,
        label: getTypeLabel(type),
        className: getTypeBadgeClass(type),
      })),
    [stage.types]
  );

  const handleFocus = () => {
    if (onFocus) {
      onFocus(stage.pokemonId);
    }
  };

  return (
    <button
      type="button"
      onClick={handleFocus}
      aria-pressed={isActive}
      className={clsx(
        "group relative flex w-full flex-col items-stretch overflow-hidden rounded-3xl border border-white/5 bg-[#0f151c]/85 p-6 text-left text-white shadow-card transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80",
        isActive ? "ring-2 ring-primary/70 shadow-lg" : "hover:-translate-y-1 hover:shadow-2xl",
        "min-h-[24rem]"
      )}
      data-testid={`evolution-stage-${stage.pokemonId}`}
    >
      <div
        className={clsx(
          "pointer-events-none absolute -inset-10 -z-10 opacity-0 blur-[110px] transition-opacity duration-500 ease-out",
          gradientClass,
          "mix-blend-screen",
          (isActive || stage.order === 1) && "opacity-80",
          "group-hover:opacity-80"
        )}
        aria-hidden="true"
      />
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/5 via-transparent to-white/10 opacity-70",
          stage.accentColor ? undefined : "mix-blend-screen"
        )}
        style={stage.accentColor ? { background: stage.accentColor } : undefined}
        aria-hidden="true"
      />

      <header className="flex items-start justify-between gap-3 text-white/80">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Etap {stage.order}</p>
          <h3 className="text-2xl font-semibold capitalize leading-tight text-white">{stage.name}</h3>
          {stage.description && <p className="mt-2 text-sm text-white/70">{stage.description}</p>}
        </div>
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-medium uppercase text-white/70 shadow-md">
          #{stage.pokemonId.toString().padStart(3, "0")}
        </span>
      </header>

      <div className="mt-6 flex justify-center">
        <EvolutionAsset
          pokemonId={stage.pokemonId}
          pokemonName={stage.name}
          sources={stage.asset}
          preference={assetPreference}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {typeBadges.map((type) => (
          <span
            key={type.value}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-md",
              type.className
            )}
          >
            {type.label}
          </span>
        ))}
      </div>

      <div className="mt-6 space-y-3 text-sm text-white/80">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Warunki ewolucji</p>
        {stage.requirements.length ? (
          <ul className="space-y-2">
            {stage.requirements.map((item) => (
              <li key={item.id} className="flex items-start gap-2 rounded-2xl bg-black/30 px-3 py-2">
                {item.icon ? <span className="text-base leading-none">{item.icon}</span> : null}
                <span>{formatRequirement(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-black/25 px-3 py-2 text-white/60">
            Brak dodatkowych warunków — naturalna ewolucja.
          </p>
        )}
      </div>

      {showStatDiffs && stage.statsDiff && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4 text-xs text-white/70">
          <p className="mb-3 font-semibold uppercase tracking-wide text-white">Zmiana statystyk</p>
          <ul className="grid grid-cols-2 gap-2">
            {Object.entries(stage.statsDiff).map(([key, value]) => {
              if (typeof value !== "number") {
                return null;
              }
              const label = STAT_LABELS[key] ?? key;
              const isPositive = value >= 0;
              return (
                <li key={key} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>{label}</span>
                  <span className={clsx(isPositive ? "text-emerald-300" : "text-red-300", "font-semibold")}>
                    {isPositive ? "+" : ""}
                    {value}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </button>
  );
}

export const EvolutionStageCard = memo(Component);
