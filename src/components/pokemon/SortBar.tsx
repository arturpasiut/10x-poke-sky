import { Button } from "@/components/ui/button";
import type { PokemonSortOrder, PokemonSortKey, SortOption } from "@/lib/pokemon/types";

interface SortBarProps {
  options: SortOption[];
  value: PokemonSortKey;
  order: PokemonSortOrder;
  onValueChange: (value: PokemonSortKey) => void;
  onToggleOrder: () => void;
  disabled?: boolean;
}

export function SortBar({ options, value, order, onValueChange, onToggleOrder, disabled = false }: SortBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-[#131d2b]/60 px-4 py-2 text-white">
      <label className="flex items-center gap-2 text-sm text-white/70">
        <span className="uppercase tracking-[0.3em] text-white/50">Sortuj</span>
        <select
          value={value}
          onChange={(event) => onValueChange(event.target.value as PokemonSortKey)}
          className="rounded-full border border-transparent bg-[#0f151c] px-3 py-1.5 text-sm text-white outline-none focus:border-primary-400 focus-outline"
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={onToggleOrder}
        className="text-white/80 hover:text-white"
        aria-label={order === "asc" ? "Zmień sortowanie na malejące" : "Zmień sortowanie na rosnące"}
      >
        <span className="text-xs uppercase tracking-[0.3em]">{order === "asc" ? "↑ Rosnąco" : "↓ Malejąco"}</span>
      </Button>
    </div>
  );
}
