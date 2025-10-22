import type { MoveSummaryDto } from "@/types";

const MAX_MOVES_PREVIEW = 12;

export interface PokemonMovesGridProps {
  moves: MoveSummaryDto[];
}

const DAMAGE_CLASS_LABEL: Record<string, string> = {
  physical: "Fizyczny",
  special: "Specjalny",
  status: "Status",
};

const formatDamageClass = (value: string | null | undefined) => {
  if (!value) return "—";
  return DAMAGE_CLASS_LABEL[value] ?? value;
};

const formatMoveName = (value: string) => value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function PokemonMovesGrid({ moves }: PokemonMovesGridProps) {
  const items = moves?.slice(0, MAX_MOVES_PREVIEW) ?? [];

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-border/40 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur">
        Nie znaleziono ruchów dla tego Pokémona.
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((move) => (
        <article
          key={move.moveId}
          className="flex flex-col gap-2 rounded-2xl border border-border/30 bg-surface/80 p-4 shadow-sm backdrop-blur transition hover:border-primary/40"
        >
          <header className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">{formatMoveName(move.name)}</h3>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {formatDamageClass(move.damageClass)}
            </span>
          </header>
          <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg bg-muted/10 px-3 py-2">
              <dt>Moc</dt>
              <dd className="font-medium text-foreground">{move.power ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/10 px-3 py-2">
              <dt>Celność</dt>
              <dd className="font-medium text-foreground">{move.accuracy ? `${move.accuracy}%` : "—"}</dd>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg bg-muted/10 px-3 py-2">
              <dt>Typ</dt>
              <dd className="font-medium capitalize text-foreground">{move.type ?? "—"}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
