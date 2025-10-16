import clsx from "clsx";

type StatusBannerProps = {
  title: string;
  description?: string;
  tone?: "info" | "warning";
  onDismiss?: () => void;
};

export function StatusBanner({ title, description, tone = "info", onDismiss }: StatusBannerProps) {
  const palette =
    tone === "warning"
      ? {
          container: "border-yellow-400/50 bg-yellow-400/10 text-yellow-100",
          accent: "text-yellow-300",
        }
      : {
          container: "border-primary-400/60 bg-primary-400/10 text-primary-100",
          accent: "text-primary-200",
        };

  return (
    <section
      className={clsx(
        "flex flex-col gap-3 rounded-2xl border px-6 py-4 shadow-[0_20px_50px_-40px_rgba(12,174,255,0.5)]",
        palette.container
      )}
      role="status"
      aria-live="polite"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className={clsx("text-xs uppercase tracking-[0.3em]", palette.accent)}>Status</p>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-current px-3 py-1 text-xs uppercase tracking-[0.3em] transition hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            aria-label="Ukryj komunikat"
          >
            Zamknij
          </button>
        ) : null}
      </header>

      {description ? <p className="text-sm">{description}</p> : null}
    </section>
  );
}
