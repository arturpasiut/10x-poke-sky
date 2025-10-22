interface MoveFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface MoveFilterChipsProps {
  chips: MoveFilterChip[];
  onClearAll?: () => void;
}

export function MoveFilterChips({ chips, onClearAll }: MoveFilterChipsProps) {
  if (chips.length === 0) {
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
              className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-primary/80 transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
          className="text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Wyczyść wszystko
        </button>
      ) : null}
    </div>
  );
}
