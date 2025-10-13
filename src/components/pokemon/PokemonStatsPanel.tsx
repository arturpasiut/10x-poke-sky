import type { PokemonStat } from "@/lib/types/pokemon";

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Atak",
  defense: "Obrona",
  "special-attack": "Sp. Atak",
  "special-defense": "Sp. Obrona",
  speed: "Szybkość",
};

const PRIMARY_COLOR = "var(--color-primary)";
const FALLBACK_MAX_STAT = 180;

export interface PokemonStatsPanelProps {
  stats: PokemonStat[];
}

export function PokemonStatsPanel({ stats }: PokemonStatsPanelProps) {
  if (!stats?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border/40 bg-muted/10 p-6 text-center text-sm text-muted-foreground backdrop-blur">
        <p>Brak danych o statystykach dla wybranego Pokémona.</p>
      </div>
    );
  }

  const maxValue = Math.max(...stats.map((entry) => entry.base_stat || 0), FALLBACK_MAX_STAT);

  return (
    <div className="space-y-4">
      {stats.map((entry) => {
        const key = entry.stat?.name ?? "unknown";
        const label = STAT_LABELS[key] ?? entry.stat?.name ?? "Stat";
        const value = entry.base_stat ?? 0;
        const percentage = Math.max(2, Math.min(100, Math.round((value / maxValue) * 100)));

        return (
          <div aria-label={`${label} ${value}`} className="space-y-2" data-testid={`stat-${key}`} key={key}>
            <div className="flex items-center justify-between text-sm font-medium text-foreground">
              <span>{label}</span>
              <span className="tabular-nums text-muted-foreground">{value}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border/40" data-testid={`stat-track-${key}`}>
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(90deg, color-mix(in srgb, ${PRIMARY_COLOR} 65%, transparent) 0%, ${PRIMARY_COLOR} 100%)`,
                }}
                data-testid={`stat-bar-${key}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
