import clsx from "clsx";

import type { MoveSummaryViewModel } from "@/lib/moves/types";

interface MoveCardProps {
  move: MoveSummaryViewModel;
}

const formatStat = (value: number | null | undefined, suffix = "") => {
  if (value == null) {
    return "—";
  }
  return suffix ? `${value}${suffix}` : String(value);
};

export function MoveCard({ move }: MoveCardProps) {
  return (
    <article
      className={clsx(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d131c]/80 p-6 text-white shadow-[0_30px_80px_-40px_rgba(20,175,255,0.6)] transition",
        "hover:-translate-y-1 hover:shadow-[0_40px_100px_-50px_rgba(20,175,255,0.75)]"
      )}
    >
      <div
        className={clsx(
          "absolute inset-0 opacity-70 blur-[60px] transition group-hover:opacity-90",
          move.gradientClass
        )}
      />
      <div className="relative z-10 flex flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Ruch</p>
            <h3 className="text-2xl font-semibold tracking-tight drop-shadow-sm">{move.displayName}</h3>
          </div>
          {move.typeLabel ? (
            <span
              className={clsx(
                "inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em]",
                move.badgeClass ?? "bg-white/10 text-white"
              )}
            >
              {move.typeLabel}
            </span>
          ) : null}
        </header>

        <dl className="grid grid-cols-2 gap-3 text-sm text-white/80">
          <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/20 p-3">
            <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Moc</dt>
            <dd className="text-lg font-semibold text-white">{formatStat(move.power)}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/20 p-3">
            <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Celność</dt>
            <dd className="text-lg font-semibold text-white">{formatStat(move.accuracy, "%")}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/20 p-3">
            <dt className="text-xs uppercase tracking-[0.3em] text-white/50">PP</dt>
            <dd className="text-lg font-semibold text-white">{formatStat(move.pp)}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/20 p-3">
            <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Generacja</dt>
            <dd className="text-lg font-semibold text-white">{move.generationLabel}</dd>
          </div>
        </dl>

        <footer className="flex items-center justify-between text-xs text-white/40">
          <span>#{move.moveId.toString().padStart(3, "0")}</span>
          <span>Ostatnia aktualizacja: {move.cachedAtLabel}</span>
        </footer>
      </div>
    </article>
  );
}
