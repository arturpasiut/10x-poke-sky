import { ArrowUpRight } from "lucide-react";
import type { FC } from "react";

import FavoritePromptCTA from "./FavoritePromptCTA";
import type { AiChatSuggestionViewModel } from "@/features/ai-chat";
import { cn } from "@/lib/utils";

interface SuggestionCardProps {
  item: AiChatSuggestionViewModel;
  isAuthenticated: boolean;
  onFavoriteToggle?: (item: AiChatSuggestionViewModel) => void;
  onLoginRedirect?: () => void;
}

const confidenceClassMap: Record<AiChatSuggestionViewModel["confidenceTier"], string> = {
  high: "bg-emerald-100/80 text-emerald-900",
  medium: "bg-amber-100/80 text-amber-900",
  low: "bg-slate-200/80 text-slate-900",
};

const SuggestionCard: FC<SuggestionCardProps> = ({ item, isAuthenticated, onFavoriteToggle, onLoginRedirect }) => {
  const confidencePercent = Math.round(item.confidence * 100);
  const confidenceLabel =
    item.confidenceTier === "high"
      ? "Wysoka pewność"
      : item.confidenceTier === "medium"
        ? "Średnia pewność"
        : "Niska pewność";

  return (
    <article className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-border/40 bg-[color:color-mix(in_srgb,var(--color-surface)_60%,transparent)] p-5 shadow-sm transition hover:border-primary/60">
      <header className="flex items-start gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-[color:color-mix(in_srgb,var(--color-surface)_80%,transparent)]">
          {item.spriteUrl ? (
            <img src={item.spriteUrl} alt={`Sprite ${item.name}`} className="size-full object-contain" loading="lazy" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">Brak grafiki</div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{confidenceLabel}</p>
          <h3 className="text-xl font-semibold text-foreground">{item.name}</h3>
          {item.summary ? <p className="text-sm text-muted-foreground">{item.summary}</p> : null}
        </div>
      </header>

      <section className="space-y-3 text-sm text-muted-foreground">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
            confidenceClassMap[item.confidenceTier]
          )}
        >
          Pewność {confidencePercent}%
        </span>
        {item.rationale ? <p className="leading-relaxed text-foreground/90">{item.rationale}</p> : null}
        {item.highlights && item.highlights.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {item.highlights.map((highlight, index) => (
              <li key={`${item.id}-highlight-${index}`} className="text-xs text-muted-foreground">
                {highlight}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={item.detailHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
        >
          <span>Otwórz szczegóły</span>
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>

        <FavoritePromptCTA
          isAuthenticated={isAuthenticated}
          status={item.favorite.status}
          disabled={!onFavoriteToggle || item.favorite.status === "saving"}
          onToggle={onFavoriteToggle ? () => onFavoriteToggle(item) : undefined}
          onLoginRedirect={onLoginRedirect}
        />
        {item.favorite.errorMessage ? (
          <p className="w-full text-xs text-destructive">{item.favorite.errorMessage}</p>
        ) : null}
      </footer>
    </article>
  );
};

export default SuggestionCard;
