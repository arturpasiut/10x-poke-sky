import clsx from "clsx";

import { Button } from "@/components/ui/button";
import { MAX_SELECTED_TYPES } from "@/lib/pokemon/filters";
import type {
  FilterOption,
  PokemonAvailableFilters,
  PokemonGenerationValue,
  PokemonRegionValue,
  PokemonTypeValue,
} from "@/lib/pokemon/types";

interface FilterSidePanelProps {
  filters: PokemonAvailableFilters;
  selectedTypes: PokemonTypeValue[];
  selectedGeneration: PokemonGenerationValue | null;
  selectedRegion: PokemonRegionValue | null;
  onToggleType: (type: PokemonTypeValue) => void;
  onSelectGeneration: (generation: PokemonGenerationValue | null) => void;
  onSelectRegion: (region: PokemonRegionValue | null) => void;
  onResetFilters: () => void;
  onClose?: () => void;
  variant?: "default" | "drawer";
}

export function FilterSidePanel({
  filters,
  selectedTypes,
  selectedGeneration,
  selectedRegion,
  onToggleType,
  onSelectGeneration,
  onSelectRegion,
  onResetFilters,
  onClose,
  variant = "default",
}: FilterSidePanelProps) {
  const containerClass =
    variant === "drawer"
      ? "flex h-full flex-col gap-6 overflow-y-auto rounded-3xl border border-border/35 bg-[color:color-mix(in_srgb,var(--color-background)_68%,rgba(255,255,255,0.22))] p-6 text-foreground backdrop-blur"
      : "pokedex-panel p-6 text-foreground shadow-card";

  const renderTypeOption = (option: FilterOption<PokemonTypeValue>) => {
    const isSelected = selectedTypes.includes(option.value);
    const selectionFull = isSelected || selectedTypes.length < MAX_SELECTED_TYPES;

    return (
      <li key={option.value}>
        <button
          type="button"
          className={clsx(
            "rounded-full px-4 py-2 text-sm font-medium uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible-outline",
            isSelected
              ? "bg-primary text-primary-foreground shadow-[0_10px_25px_-15px_rgba(255,90,90,0.7)]"
              : selectionFull
                ? "pokedex-chip"
                : "border border-border/30 bg-[color:color-mix(in_srgb,var(--color-foreground)_8%,transparent)] text-foreground/35 cursor-not-allowed"
          )}
          onClick={() => onToggleType(option.value)}
          aria-pressed={isSelected}
          disabled={!selectionFull}
        >
          {option.label}
        </button>
      </li>
    );
  };

  const renderRadioList = <T extends string>(
    options: FilterOption<T>[],
    selected: T | null,
    onChange: (value: T | null) => void,
    ariaName: string
  ) => (
    <div role="radiogroup" aria-label={ariaName} className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={clsx(
          "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible-outline",
          selected === null
            ? "border-primary/60 bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-primary-foreground"
            : "border-border/35 bg-[color:color-mix(in_srgb,var(--color-foreground)_10%,transparent)] text-foreground/80 hover:border-primary/35"
        )}
        aria-pressed={selected === null}
      >
        <span>Wszystkie</span>
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsx(
            "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible-outline",
            selected === option.value
              ? "border-primary/60 bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-primary-foreground"
              : "border-border/35 bg-[color:color-mix(in_srgb,var(--color-foreground)_10%,transparent)] text-foreground/80 hover:border-primary/35"
          )}
          aria-pressed={selected === option.value}
        >
          <span>{option.label}</span>
          {option.count ? <span className="text-xs text-foreground/45">{option.count}</span> : null}
        </button>
      ))}
    </div>
  );

  return (
    <aside className={containerClass} aria-label="Filtry Pokédexu">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary-300">Filtry</p>
          <h2 className="text-2xl font-semibold text-foreground">Dopasuj wyniki</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs uppercase tracking-[0.3em] text-primary-200 hover:text-primary-100 focus-visible-outline"
            onClick={onResetFilters}
          >
            Resetuj
          </Button>
          {variant === "drawer" && onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-foreground/70 hover:text-foreground focus-visible-outline"
              aria-label="Zamknij filtry"
              onClick={onClose}
            >
              ×
            </Button>
          ) : null}
        </div>
      </header>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">
          Typ ({selectedTypes.length}/{MAX_SELECTED_TYPES})
        </h3>
        <ul className="flex flex-wrap gap-2">{filters.types.map(renderTypeOption)}</ul>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">Generacja</h3>
        {renderRadioList(filters.generations, selectedGeneration, onSelectGeneration, "Filtruj według generacji")}
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">Region</h3>
        {renderRadioList(filters.regions, selectedRegion, onSelectRegion, "Filtruj według regionu")}
      </section>
    </aside>
  );
}
