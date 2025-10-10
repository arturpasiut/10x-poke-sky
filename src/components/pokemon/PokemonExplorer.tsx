import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

import { PokemonGrid } from "./PokemonGrid";
import { PokemonFilters } from "./PokemonFilters";
import { PokemonSearchBar } from "./PokemonSearchBar";

export interface PokemonExplorerProps {
  initialSearch?: string;
  initialFilters?: {
    types: string[];
    generation: string;
    region: string;
  };
}

export function PokemonExplorer({ initialSearch = "", initialFilters }: PokemonExplorerProps) {
  const [search, setSearch] = useState(initialSearch);
  const [types, setTypes] = useState<string[]>(initialFilters?.types ?? []);
  const [generation, setGeneration] = useState(initialFilters?.generation ?? "");
  const [region, setRegion] = useState(initialFilters?.region ?? "");

  const debouncedSearch = useDebouncedValue(search, 400);
  useEffect(() => {
    setTypes(initialFilters?.types ?? []);
    setGeneration(initialFilters?.generation ?? "");
    setRegion(initialFilters?.region ?? "");
  }, [initialFilters]);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (search.trim()) {
      params.set("q", search.trim());
    } else {
      params.delete("q");
    }

    params.delete("type");
    params.delete("generation");
    params.delete("region");

    types.forEach((type) => params.append("type", type));

    if (generation) {
      params.set("generation", generation);
    }

    if (region) {
      params.set("region", region);
    }

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [search, types, generation, region]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      setSearch(params.get("q") ?? "");
      setTypes(params.getAll("type").map((value) => value.trim().toLowerCase()));
      setGeneration(params.get("generation") ?? "");
      setRegion(params.get("region") ?? "");
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const toggleType = (type: string) => {
    const normalized = type.trim().toLowerCase();
    setTypes((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((item) => item !== normalized);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, normalized];
    });
  };

  const handleGenerationSelect = (value: string) => {
    setGeneration(value);
  };

  const handleRegionSelect = (value: string) => {
    setRegion(value);
  };

  const handleResetFilters = () => {
    setTypes([]);
    setGeneration("");
    setRegion("");
  };

  const normalizedTypes = useMemo(
    () => [...new Set(types.map((type) => type.trim().toLowerCase()))].filter(Boolean).sort(),
    [types]
  );

  return (
    <section className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
      <div className="order-last space-y-6 lg:order-first">
        <PokemonSearchBar value={search} onChange={setSearch} />
        <PokemonFilters
          selectedTypes={types}
          onToggleType={toggleType}
          selectedGeneration={generation}
          onSelectGeneration={handleGenerationSelect}
          selectedRegion={region}
          onSelectRegion={handleRegionSelect}
          onReset={handleResetFilters}
        />
      </div>
      <div className="space-y-8">
        <PokemonGrid search={debouncedSearch} types={normalizedTypes} generation={generation} region={region} />
      </div>
    </section>
  );
}
