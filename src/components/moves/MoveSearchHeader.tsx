import { useId } from "react";

import { Button } from "@/components/ui/button";

interface MoveSearchHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  onResetAll: () => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  isLoading?: boolean;
}

export function MoveSearchHeader({
  searchValue,
  onSearchChange,
  onSubmit,
  onResetAll,
  onOpenFilters,
  hasActiveFilters,
  isLoading = false,
}: MoveSearchHeaderProps) {
  const searchId = useId();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#0b1119]/80 p-6 text-white shadow-[0_30px_100px_-60px_rgba(20,175,255,0.65)]">
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Przegląd ruchów</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Znajdź idealny ruch</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Filtruj ciosy inspirowane barwami Pokémonów według typu, regionu oraz mocy. Szukaj błyskawicznych ataków i
          taktycznych wsparć jednym dotknięciem.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">
            Wyszukaj ruch
          </label>
          <input
            id={searchId}
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Wpisz nazwę ruchu lub słowo kluczowe"
            className="w-full rounded-full border border-transparent bg-[#101926] px-6 py-3 pr-12 text-base text-white outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg text-white/60 transition hover:text-white"
            aria-label="Szukaj ruchów"
            disabled={isLoading}
          >
            🔍
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onOpenFilters}
            className="relative flex items-center gap-2"
          >
            <span>Filtry</span>
            {hasActiveFilters ? (
              <span className="absolute -right-2 -top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black shadow-lg">
                •
              </span>
            ) : null}
          </Button>

          <Button type="button" variant="ghost" onClick={onResetAll} disabled={isLoading}>
            Resetuj wszystko
          </Button>
        </div>
      </form>
    </header>
  );
}
