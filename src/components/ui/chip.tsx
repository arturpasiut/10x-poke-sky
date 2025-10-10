import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      intent: {
        default: "border-border/70 bg-muted/50 text-muted-foreground hover:bg-muted/70",
        soft: "border-transparent bg-surface/90 text-foreground shadow-sm hover:bg-surface",
        outline: "border-border text-muted-foreground hover:bg-muted/40",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-muted/20",
      },
      size: {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-2.5 text-base",
      },
      state: {
        inactive: "",
        active: "border-primary/70 bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90",
      },
    },
    defaultVariants: {
      intent: "default",
      size: "md",
      state: "inactive",
    },
  }
);

const toneClasses = {
  bug: "bg-pokemon-bug/15 text-pokemon-bug hover:bg-pokemon-bug/25",
  dark: "bg-pokemon-dark/20 text-white hover:bg-pokemon-dark/30",
  dragon: "bg-pokemon-dragon/15 text-pokemon-dragon hover:bg-pokemon-dragon/25",
  electric: "bg-pokemon-electric/25 text-pokemon-electric hover:bg-pokemon-electric/35",
  fairy: "bg-pokemon-fairy/20 text-pokemon-fairy hover:bg-pokemon-fairy/30",
  fire: "bg-pokemon-fire/20 text-pokemon-fire hover:bg-pokemon-fire/30",
  flying: "bg-pokemon-flying/15 text-pokemon-flying hover:bg-pokemon-flying/25",
  ghost: "bg-pokemon-ghost/20 text-white hover:bg-pokemon-ghost/30",
  ice: "bg-pokemon-ice/25 text-pokemon-ice hover:bg-pokemon-ice/35",
  poison: "bg-pokemon-poison/20 text-pokemon-poison hover:bg-pokemon-poison/30",
  psychic: "bg-pokemon-psychic/20 text-pokemon-psychic hover:bg-pokemon-psychic/30",
  rock: "bg-pokemon-rock/20 text-pokemon-rock hover:bg-pokemon-rock/30",
  steel: "bg-pokemon-steel/20 text-pokemon-steel hover:bg-pokemon-steel/30",
  water: "bg-pokemon-water/20 text-pokemon-water hover:bg-pokemon-water/30",
  fighting: "bg-pokemon-fighting/20 text-pokemon-fighting hover:bg-pokemon-fighting/30",
  grass: "bg-pokemon-grass/20 text-pokemon-grass hover:bg-pokemon-grass/30",
  ground: "bg-pokemon-ground/20 text-pokemon-ground hover:bg-pokemon-ground/30",
  normal: "bg-neutral-light/40 text-neutral-dark hover:bg-neutral-light/60",
} as const;

export type ChipTone = keyof typeof toneClasses;

export type ChipProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> &
  VariantProps<typeof chipVariants> & {
    asChild?: boolean;
    active?: boolean;
    tone?: ChipTone;
  };

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, intent, size, active, tone, asChild = false, state, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const resolvedState = state ?? (active ? "active" : "inactive");

    return (
      <Comp
        ref={ref}
        data-slot="chip"
        data-active={resolvedState === "active" ? "true" : "false"}
        className={cn(chipVariants({ intent, size, state: resolvedState }), tone ? toneClasses[tone] : "", className)}
        {...props}
      />
    );
  }
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
