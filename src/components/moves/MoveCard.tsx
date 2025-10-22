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
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d131c]/90 p-6 text-white backdrop-blur transition",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_32px_80px_-50px_rgba(56,189,248,0.65)]"
      )}
    >
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 opacity-60 blur-[80px] transition group-hover:opacity-90",
          move.gradientClass
        )}
      />
      <div className="relative z-10 flex h-full flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">Ruch</p>
            <h3 className="text-2xl font-semibold tracking-tight leading-tight drop-shadow-sm">{move.displayName}</h3>
          </div>
          {move.typeLabel ? (
            <span
              className={clsx(
                "inline-flex min-w-[88px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.45em]",
                move.badgeClass ?? "bg-white/10 text-white"
              )}
            >
              {move.typeLabel}
            </span>
          ) : null}
        </header>

        <dl className="grid grid-cols-2 gap-3 text-sm text-white/80 sm:gap-4">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-black/25 p-3">
            <dt className="text-[10px] uppercase tracking-[0.3em] text-white/45">Moc</dt>
            <dd className="text-xl font-semibold leading-tight text-white">{formatStat(move.power)}</dd>
          </div>
          <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-black/25 p-3">
            <dt className="text-[10px] uppercase tracking-[0.3em] text-white/45">Celność</dt>
            <dd className="text-xl font-semibold leading-tight text-white">{formatStat(move.accuracy, "%")}</dd>
          </div>
          <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-black/25 p-3">
            <dt className="text-[10px] uppercase tracking-[0.3em] text-white/45">PP</dt>
            <dd className="text-xl font-semibold leading-tight text-white">{formatStat(move.pp)}</dd>
          </div>
          <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-black/25 p-3">
            <dt className="text-[10px] uppercase tracking-[0.3em] text-white/45">Generacja</dt>
            <dd className="text-base font-semibold leading-tight text-white/90">{move.generationLabel}</dd>
          </div>
        </dl>

        <footer className="mt-auto flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-white/35">
          <span>#{move.moveId.toString().padStart(3, "0")}</span>
          <span className="truncate text-right">Ostatnia aktualizacja: {move.cachedAtLabel}</span>
        </footer>
      </div>
    </article>
  );
}
