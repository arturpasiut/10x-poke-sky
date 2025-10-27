import { Button } from "@/components/ui/button";
import type { MoveSortKey, MoveSortOrder } from "@/lib/moves/types";

import { MOVE_SORT_OPTIONS } from "@/lib/moves/constants";

interface MoveSortBarProps {
  value: MoveSortKey;
  order: MoveSortOrder;
  onValueChange: (value: MoveSortKey) => void;
  onToggleOrder: () => void;
  disabled?: boolean;
}

export function MoveSortBar({ value, order, onValueChange, onToggleOrder, disabled = false }: MoveSortBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-[#131d2b]/70 px-4 py-2 text-white shadow-[0_20px_60px_-50px_rgba(20,175,255,0.75)]">
      <label className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/60">
        Sortuj
        <select
          value={value}
          onChange={(event) => onValueChange(event.target.value as MoveSortKey)}
          className="rounded-full border border-transparent bg-[#0f151c] px-3 py-1.5 text-sm text-white outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          disabled={disabled}
        >
          {MOVE_SORT_OPTIONS.map((option) => (
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
        <span className="text-xs uppercase tracking-[0.35em]">{order === "asc" ? "↑ Rosnąco" : "↓ Malejąco"}</span>
      </Button>
    </div>
  );
}
