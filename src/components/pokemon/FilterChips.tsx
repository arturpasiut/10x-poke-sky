import type { FilterChipViewModel } from "@/lib/pokemon/types";

type FilterChipsProps = {
  chips: FilterChipViewModel[];
  onClearAll?: () => void;
};

export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (!chips.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ul className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li key={chip.id}>
            <button
              type="button"
              onClick={chip.onRemove}
              className="flex items-center gap-2 rounded-full border border-primary-400/60 bg-primary-400/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-primary-200 transition hover:bg-primary-400/20 focus-visible:outline-none focus-visible-outline"
              aria-label={`Usuń filtr ${chip.label}`}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>

      {onClearAll ? (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300 hover:text-primary-200 focus-visible:outline-none focus-visible-outline"
        >
          Wyczyść wszystko
        </button>
      ) : null}
    </div>
  );
}
