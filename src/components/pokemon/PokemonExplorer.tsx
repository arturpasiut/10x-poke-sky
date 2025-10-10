import { useEffect, useState } from "react";

import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

import { PokemonGrid } from "./PokemonGrid";
import { PokemonSearchBar } from "./PokemonSearchBar";

export interface PokemonExplorerProps {
  initialSearch?: string;
}

export function PokemonExplorer({ initialSearch = "" }: PokemonExplorerProps) {
  const [search, setSearch] = useState(initialSearch);

  const debouncedSearch = useDebouncedValue(search, 400);

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

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [search]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      setSearch(params.get("q") ?? "");
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return (
    <section className="mt-10 space-y-8">
      <PokemonSearchBar value={search} onChange={setSearch} />
      <PokemonGrid search={debouncedSearch} />
    </section>
  );
}
