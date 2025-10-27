import { Button } from "@/components/ui/button";

interface MoveEmptyStateProps {
  onResetFilters: () => void;
}

export function MoveEmptyState({ onResetFilters }: MoveEmptyStateProps) {
  return (
    <section className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0b1118]/80 p-12 text-center text-white shadow-[0_25px_70px_-40px_rgba(64,196,255,0.65)]">
      <div className="flex flex-col gap-3">
        <span className="text-6xl" role="img" aria-hidden="true">
          ⚡
        </span>
        <h2 className="text-2xl font-semibold tracking-tight">Brak ruchów spełniających warunki</h2>
        <p className="max-w-xl text-sm text-white/70">
          {
            "Spróbuj rozluźnić filtry – szczególnie typ i zakres mocy – aby odkryć więcej ruchów inspirowanych barwami świata Pokémon."
          }
        </p>
      </div>

      <Button type="button" variant="outline" onClick={onResetFilters} className="border-primary/60 text-primary">
        Resetuj filtry
      </Button>
    </section>
  );
}
