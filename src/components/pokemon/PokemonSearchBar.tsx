import { useCallback } from "react";

interface PokemonSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function PokemonSearchBar({ value, onChange }: PokemonSearchBarProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return (
    <div className="relative w-full">
      <input
        value={value}
        onChange={handleChange}
        placeholder="Szukaj pokemona po nazwie"
        className="w-full rounded-full border border-border/40 bg-background/90 px-6 py-4 pr-14 text-base text-foreground shadow-inner outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        type="search"
        name="pokemon-search"
        autoComplete="off"
      />
      <span className="pointer-events-none absolute right-6 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground">
        🔍
      </span>
    </div>
  );
}
