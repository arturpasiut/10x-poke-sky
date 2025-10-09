import type { FC } from "react";

import SuggestionCard from "./SuggestionCard";
import type { AiChatSuggestionViewModel } from "@/features/ai-chat";

interface SuggestionCardsProps {
  items: AiChatSuggestionViewModel[];
  isAuthenticated: boolean;
  isLoading?: boolean;
  onFavoriteToggle?: (item: AiChatSuggestionViewModel) => void;
  onLoginRedirect?: () => void;
}

const SuggestionCards: FC<SuggestionCardsProps> = ({
  items,
  isAuthenticated,
  isLoading,
  onFavoriteToggle,
  onLoginRedirect,
}) => {
  if (isLoading && items.length === 0) {
    return null;
  }

  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-border/50 p-6 text-sm text-muted-foreground">
        <p>Gdy asystent znajdzie dopasowania, pojawią się tutaj karty z rekomendowanymi Pokémonami.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Proponowane dopasowania
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <SuggestionCard
            key={item.id}
            item={item}
            isAuthenticated={isAuthenticated}
            onFavoriteToggle={onFavoriteToggle}
            onLoginRedirect={onLoginRedirect}
          />
        ))}
      </div>
    </section>
  );
};

export default SuggestionCards;
