import { memo, useCallback, useId, useMemo, useState, type FormEvent } from "react";

import clsx from "clsx";

import { selectEvolutionAssetPreference, useEvolutionStore } from "@/stores/useEvolutionStore";
import { getTypeLabel, POKEMON_GENERATION_OPTIONS, POKEMON_TYPE_OPTIONS } from "@/lib/pokemon/filters";
import type { PokemonGenerationValue, PokemonTypeValue } from "@/lib/pokemon/types";

export type EvolutionBranchFilter = "any" | "linear" | "branching";

export interface EvolutionSearchFormValues {
  term: string;
  type: PokemonTypeValue | null;
  generation: PokemonGenerationValue | null;
  branching: EvolutionBranchFilter;
}

export interface EvolutionSearchFormProps {
  defaultValues?: Partial<EvolutionSearchFormValues>;
  isLoading?: boolean;
  onSubmit?: (values: EvolutionSearchFormValues) => void;
  onChange?: (values: EvolutionSearchFormValues) => void;
  className?: string;
}

const DEFAULT_VALUES: EvolutionSearchFormValues = {
  term: "",
  type: null,
  generation: null,
  branching: "any",
};

function normalizeValues(values: Partial<EvolutionSearchFormValues> | undefined): EvolutionSearchFormValues {
  if (!values) {
    return DEFAULT_VALUES;
  }

  return {
    term: values.term ?? DEFAULT_VALUES.term,
    type: values.type ?? DEFAULT_VALUES.type,
    generation: values.generation ?? DEFAULT_VALUES.generation,
    branching: values.branching ?? DEFAULT_VALUES.branching,
  };
}

function Component({ defaultValues, isLoading = false, onSubmit, onChange, className }: EvolutionSearchFormProps) {
  const normalizedDefaults = useMemo(() => normalizeValues(defaultValues), [defaultValues]);
  const [values, setValues] = useState<EvolutionSearchFormValues>(normalizedDefaults);
  const [error, setError] = useState<string | null>(null);
  const assetPreference = useEvolutionStore(selectEvolutionAssetPreference);
  const setAssetPreference = useEvolutionStore((state) => state.setAssetPreference);

  const searchFieldId = useId();
  const typeFieldId = useId();
  const generationFieldId = useId();

  const handleChange = useCallback(
    (next: Partial<EvolutionSearchFormValues>) => {
      setValues((prev) => {
        const merged = { ...prev, ...next };
        onChange?.(merged);
        return merged;
      });
    },
    [onChange]
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (values.term.trim().length > 0 && values.term.trim().length < 2) {
        setError("Wpisz przynajmniej 2 znaki, aby wyszukać łańcuch");
        return;
      }

      setError(null);
      onSubmit?.(values);
    },
    [onSubmit, values]
  );

  const handleAssetToggle = useCallback(
    (preference: "gif" | "sprite") => {
      setAssetPreference(preference);
    },
    [setAssetPreference]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        "rounded-3xl border border-white/10 bg-[#0b1220]/80 p-6 shadow-xl backdrop-blur-md",
        "flex flex-col gap-4 text-white",
        className
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Znajdź łańcuch ewolucji</h2>
          <p className="text-sm text-white/60">
            Wyszukaj po nazwie Pokémona i zawęź wyniki według generacji, typu lub rodzaju rozgałęzienia.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70 shadow-inner">
          <span className="uppercase tracking-wide">Preferuj animacje</span>
          <div className="inline-flex rounded-full bg-white/10 p-1">
            <button
              type="button"
              className={clsx(
                "rounded-full px-3 py-1 font-semibold uppercase tracking-wide transition",
                assetPreference === "gif" ? "bg-primary/80 text-white shadow" : "text-white/70 hover:text-white"
              )}
              onClick={() => handleAssetToggle("gif")}
            >
              GIF
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-full px-3 py-1 font-semibold uppercase tracking-wide transition",
                assetPreference === "sprite" ? "bg-primary/80 text-white shadow" : "text-white/70 hover:text-white"
              )}
              onClick={() => handleAssetToggle("sprite")}
            >
              Sprite
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-2">
          <label htmlFor={searchFieldId} className="text-sm font-medium text-white/80">
            Nazwa Pokémona lub łańcucha
          </label>
          <input
            id={searchFieldId}
            type="search"
            placeholder="np. Eevee, Bulbasaur..."
            value={values.term}
            onChange={(event) => handleChange({ term: event.target.value })}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={generationFieldId} className="text-sm font-medium text-white/80">
            Generacja
          </label>
          <select
            id={generationFieldId}
            value={values.generation ?? ""}
            onChange={(event) =>
              handleChange({ generation: (event.target.value || null) as PokemonGenerationValue | null })
            }
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <option value="">Wszystkie generacje</option>
            {POKEMON_GENERATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={typeFieldId} className="text-sm font-medium text-white/80">
            Typ
          </label>
          <select
            id={typeFieldId}
            value={values.type ?? ""}
            onChange={(event) => handleChange({ type: (event.target.value || null) as PokemonTypeValue | null })}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <option value="">Dowolny typ</option>
            {POKEMON_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {getTypeLabel(option.value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-white/70">Rozgałęzienie:</span>
          {(["any", "linear", "branching"] as EvolutionBranchFilter[]).map((option) => {
            const label = option === "any" ? "Dowolne" : option === "linear" ? "Liniowe" : "Rozgałęzione (np. Eevee)";
            const isActive = values.branching === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleChange({ branching: option })}
                className={clsx(
                  "rounded-full border px-3 py-1 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                  isActive
                    ? "border-primary/70 bg-primary/25 text-white shadow"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 md:justify-end">
          {error && <p className="text-sm font-medium text-rose-300">{error}</p>}
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {isLoading && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            Szukaj łańcucha
          </button>
        </div>
      </div>
    </form>
  );
}

export const EvolutionSearchForm = memo(Component);
