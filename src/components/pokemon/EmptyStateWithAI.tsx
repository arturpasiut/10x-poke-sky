import { Button } from "@/components/ui/button";

interface EmptyStateWithAIProps {
  title?: string;
  description?: string;
  ctaLabel: string;
  onCta: () => void;
}

export function EmptyStateWithAI({
  title = "Brak wyników dla wybranych filtrów",
  description = "Spróbuj dostosować wyszukiwanie lub poproś nasze AI o pomoc w znalezieniu odpowiedniego Pokémona.",
  ctaLabel,
  onCta,
}: EmptyStateWithAIProps) {
  return (
    <section className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-white/10 bg-[#101722] p-12 text-center shadow-[0_25px_60px_-35px_rgba(0,0,0,0.6)]">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-primary-300">Pusto?</p>
        <h2 className="text-3xl font-semibold text-white">{title}</h2>
        <p className="max-w-xl text-base text-white/70">{description}</p>
      </div>

      <Button onClick={onCta} size="lg">
        {ctaLabel}
      </Button>
    </section>
  );
}
