import clsx from "clsx";

import { Button } from "@/components/ui/button";
import type { MoveAvailableFilters, MoveSortKey } from "@/lib/moves/types";
import type { MoveDamageClassValue } from "@/types";
import type { PokemonRegionValue, PokemonTypeValue } from "@/lib/pokemon/types";

interface MoveFilterPanelProps {
  filters: MoveAvailableFilters;
  selectedTypes: PokemonTypeValue[];
  selectedDamageClasses: MoveDamageClassValue[];
  selectedRegion: PokemonRegionValue | null;
  minPower: number | null;
  maxPower: number | null;
  sortKey: MoveSortKey;
  onToggleType: (type: PokemonTypeValue) => void;
  onToggleDamageClass: (value: MoveDamageClassValue) => void;
  onSelectRegion: (region: PokemonRegionValue | null) => void;
  onMinPowerChange: (value: number | null) => void;
  onMaxPowerChange: (value: number | null) => void;
  onResetFilters: () => void;
  onSortChange: (value: MoveSortKey) => void;
  onClose?: () => void;
  variant?: "default" | "drawer";
}

const formatPowerValue = (value: number | null) => (value == null ? "" : String(value));

export function MoveFilterPanel({
  filters,
  selectedTypes,
  selectedDamageClasses,
  selectedRegion,
  minPower,
  maxPower,
  sortKey,
  onToggleType,
  onToggleDamageClass,
  onSelectRegion,
  onMinPowerChange,
  onMaxPowerChange,
  onResetFilters,
  onSortChange,
  onClose,
  variant = "default",
}: MoveFilterPanelProps) {
  const containerClass =
    variant === "drawer"
      ? "flex h-full flex-col gap-6 overflow-y-auto bg-[#0d131c] p-6 text-white"
      : "pokedex-panel sticky top-24 flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#0c141e]/80 p-6 text-white shadow-[0_35px_90px_-50px_rgba(20,175,255,0.55)] backdrop-blur";

  const renderTypeOption = (option: (typeof filters.types)[number]) => {
    const isSelected = selectedTypes.includes(option.value);

    return (
      <li key={option.value}>
        <button
          type="button"
          className={clsx(
            "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isSelected
              ? "bg-primary text-black shadow-[0_18px_40px_-24px_rgba(56,189,248,0.75)]"
              : "border border-white/10 bg-white/5 text-white/80 hover:border-primary/60 hover:bg-primary/10"
          )}
          onClick={() => onToggleType(option.value)}
          aria-pressed={isSelected}
        >
          {option.label}
        </button>
      </li>
    );
  };

  const renderDamageClassOption = (option: (typeof filters.damageClasses)[number]) => {
    const isSelected = selectedDamageClasses.includes(option.value);

    return (
      <li key={option.value}>
        <button
          type="button"
          className={clsx(
            "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isSelected
              ? "border border-primary/70 bg-primary/20 text-white"
              : "border border-white/10 bg-white/5 text-white/80 hover:border-primary/60 hover:bg-primary/10"
          )}
          onClick={() => onToggleDamageClass(option.value)}
          aria-pressed={isSelected}
        >
          {option.label}
        </button>
      </li>
    );
  };

  const renderRegionOption = (option: (typeof filters.regions)[number]) => {
    const isSelected = selectedRegion === option.value;

    return (
      <button
        key={option.value}
        type="button"
        className={clsx(
          "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isSelected
            ? "border-primary/60 bg-primary/20 text-white"
            : "border-white/10 bg-white/5 text-white/70 hover:border-primary/40 hover:bg-primary/10"
        )}
        onClick={() => onSelectRegion(isSelected ? null : option.value)}
        aria-pressed={isSelected}
      >
        <span>{option.label}</span>
      </button>
    );
  };

  return (
    <aside className={containerClass} aria-label="Filtry ruchów">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Filtry</p>
          <h2 className="text-2xl font-semibold">Dopasuj listę ruchów</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs uppercase tracking-[0.35em] text-primary hover:text-primary/80"
            onClick={onResetFilters}
          >
            Resetuj
          </Button>
          {variant === "drawer" && onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white"
              aria-label="Zamknij panel filtrów"
              onClick={onClose}
            >
              ×
            </Button>
          ) : null}
        </div>
      </header>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
          Typ (wybrano {selectedTypes.length})
        </h3>
        <ul className="flex flex-wrap gap-2">{filters.types.map(renderTypeOption)}</ul>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
          Typ ruchu (wybrano {selectedDamageClasses.length})
        </h3>
        <ul className="flex flex-wrap gap-2">{filters.damageClasses.map(renderDamageClassOption)}</ul>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Region</h3>
        <div className="flex flex-col gap-2">
          {filters.regions.map(renderRegionOption)}
          <button
            type="button"
            className={clsx(
              "rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              selectedRegion === null
                ? "border-primary/60 bg-primary/20 text-white"
                : "border-white/10 bg-white/5 text-white/60 hover:border-primary/40 hover:bg-primary/10"
            )}
            onClick={() => onSelectRegion(null)}
          >
            Wszystkie regiony
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Zakres mocy</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
            Od
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={300}
              step={5}
              value={formatPowerValue(minPower)}
              onChange={(event) =>
                onMinPowerChange(event.target.value ? Number.parseInt(event.target.value, 10) : null)
              }
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-base text-white outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
              placeholder="0"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
            Do
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={300}
              step={5}
              value={formatPowerValue(maxPower)}
              onChange={(event) =>
                onMaxPowerChange(event.target.value ? Number.parseInt(event.target.value, 10) : null)
              }
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-base text-white outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
              placeholder="300"
            />
          </label>
        </div>
        <p className="text-xs text-white/40">Pozostaw puste, aby wyświetlić pełną gamę ruchów.</p>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Sortowanie</h3>
        <select
          value={sortKey}
          onChange={(event) => onSortChange(event.target.value as MoveSortKey)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <option value="name">Nazwa</option>
          <option value="power">Moc</option>
          <option value="accuracy">Celność</option>
          <option value="cachedAt">Ostatnia aktualizacja</option>
        </select>
      </section>
    </aside>
  );
}
