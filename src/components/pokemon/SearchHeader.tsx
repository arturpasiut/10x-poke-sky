import { type FormEvent, useRef } from "react";

import clsx from "clsx";

import { Button } from "@/components/ui/button";

type SearchHeaderProps = {
  search: string;
  total?: number;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  isLoading?: boolean;
};

export function SearchHeader({
  search,
  total,
  onSearchChange,
  onSubmit,
  onReset,
  isLoading = false,
}: SearchHeaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const showReset = Boolean(search);

  return (
    <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#0e1621]/80 p-6 shadow-card-soft">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        role="search"
        aria-label="Wyszukaj Pokémona"
      >
        <div className="relative flex flex-1 items-center">
          <span className="pointer-events-none absolute left-4 text-white/40">🔍</span>
          <input
            ref={inputRef}
            type="search"
            value={search}
            placeholder="Nazwa, numer Pokédexu, typ..."
            onChange={(event) => onSearchChange(event.target.value)}
            className={clsx(
              "w-full rounded-full border border-white/10 bg-[#09101a] py-3 pr-4 pl-12 text-base text-white outline-none",
              "placeholder:text-white/40 focus:border-primary-400 focus-outline sm:text-lg"
            )}
            maxLength={100}
            aria-label="Wyszukaj w Pokédexie"
          />
        </div>

        <div className="flex items-center gap-2">
          {showReset ? (
            <Button
              type="button"
              variant="ghost"
              className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
              onClick={() => {
                onReset();
                inputRef.current?.focus();
              }}
            >
              Wyczyść
            </Button>
          ) : null}

          <Button type="submit" disabled={isLoading} size="lg" className="sm:px-8">
            {isLoading ? "Szukam..." : "Szukaj"}
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
        <p className="uppercase tracking-[0.3em] text-primary-300">Wyniki</p>
        <p className="text-lg font-semibold text-white">{typeof total === "number" ? `${total} Pokémonów` : "—"}</p>
      </div>
    </header>
  );
}
