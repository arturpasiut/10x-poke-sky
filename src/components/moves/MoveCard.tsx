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
        <header className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">Ruch</p>
            <h3 className="text-2xl font-semibold tracking-tight leading-snug drop-shadow-sm sm:text-[28px]">
              {move.displayName}
            </h3>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            {move.typeLabel ? (
              <span
                className={clsx(
                  "inline-flex min-w-[64px] items-center justify-center rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.25em]",
                  move.badgeClass ?? "bg-white/10 text-white"
                )}
              >
                {move.typeLabel}
              </span>
            ) : null}
            {move.damageClassLabel ? (
              <span className="inline-flex min-w-[64px] items-center justify-center rounded-full border border-white/20 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/80">
                {move.damageClassLabel}
              </span>
            ) : null}
          </div>
        </header>

        <dl className="grid grid-cols-2 gap-3 text-xs text-white/80 sm:gap-4 sm:text-sm">
          <div className="flex h-full flex-col items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
            <dt className="text-[10px] uppercase tracking-[0.3em] text-white/45">Moc</dt>
            <dd className="text-base font-semibold leading-tight text-white sm:text-lg">{formatStat(move.power)}</dd>
          </div>
          <div className="flex h-full flex-col items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
            <dt className="text-[10px] uppercase tracking-[0.3em] text-white/45">Celność</dt>
            <dd className="text-base font-semibold leading-tight text-white sm:text-lg">
              {formatStat(move.accuracy, "%")}
            </dd>
          </div>
          <div className="flex h-full flex-col items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
            <dt className="text-[10px] uppercase tracking-[0.3em] text-white/45">PP</dt>
            <dd className="text-base font-semibold leading-tight text-white sm:text-lg">{formatStat(move.pp)}</dd>
          </div>
          <div className="flex h-full flex-col items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
            <dt className="text-[10px] uppercase tracking-[0.3em] text-white/45">Generacja</dt>
            <dd className="text-xs font-semibold leading-tight text-white/90 sm:text-sm">{move.generationLabel}</dd>
          </div>
        </dl>

        <footer className="mt-auto flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/35 sm:text-[11px]">
          <span className="text-white/45">{move.cachedAtLabel}</span>
          <span className="text-white/30">Ostatnia aktualizacja</span>
          <span className="ml-auto shrink-0 text-white/35">#{move.moveId.toString().padStart(3, "0")}</span>
        </footer>
      </div>
    </article>
  );
}
