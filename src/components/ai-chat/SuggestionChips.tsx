import { Droplet, Flame, Sparkles, Zap, type LucideIcon, Snowflake } from "lucide-react";
import type { FC } from "react";

import { Button } from "@/components/ui/button";
import type { SuggestionChip } from "@/features/ai-chat";

interface SuggestionChipsProps {
  items: SuggestionChip[];
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}

const iconRegistry: Record<string, LucideIcon> = {
  Droplet,
  Zap,
  Snowflake,
  Flame,
  Sparkles,
};

const SuggestionChips: FC<SuggestionChipsProps> = ({ items, onSelect, disabled }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Szybkie inspiracje</p>
      <div className="flex flex-wrap gap-2">
        {items.map((chip) => {
          const Icon = chip.icon ? (iconRegistry[chip.icon] ?? Sparkles) : null;

          return (
            <Button
              key={chip.id}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-border/60 px-3 py-1 text-xs font-medium shadow-none backdrop-blur"
              onClick={() => onSelect(chip.prompt)}
              disabled={disabled}
            >
              {Icon ? <Icon className="mr-1.5 size-3.5" aria-hidden="true" /> : null}
              {chip.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionChips;
