import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-muted-foreground",
        surface: "border-border/60 bg-surface text-foreground shadow-sm",
        outline: "border-border text-foreground",
        primary: "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground shadow-xs",
        tertiary: "border-transparent bg-tertiary text-tertiary-foreground shadow-xs",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40 dark:hover:bg-muted/10",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const toneClasses = {
  bug: "border-transparent bg-pokemon-bug/15 text-pokemon-bug",
  dark: "border-transparent bg-pokemon-dark/20 text-pokemon-dark",
  dragon: "border-transparent bg-pokemon-dragon/15 text-pokemon-dragon",
  electric: "border-transparent bg-pokemon-electric/20 text-pokemon-electric",
  fairy: "border-transparent bg-pokemon-fairy/20 text-pokemon-fairy",
  fire: "border-transparent bg-pokemon-fire/20 text-pokemon-fire",
  flying: "border-transparent bg-pokemon-flying/20 text-pokemon-flying",
  ghost: "border-transparent bg-pokemon-ghost/20 text-pokemon-ghost",
  ice: "border-transparent bg-pokemon-ice/20 text-pokemon-ice",
  poison: "border-transparent bg-pokemon-poison/20 text-pokemon-poison",
  psychic: "border-transparent bg-pokemon-psychic/20 text-pokemon-psychic",
  rock: "border-transparent bg-pokemon-rock/20 text-pokemon-rock",
  steel: "border-transparent bg-pokemon-steel/20 text-pokemon-steel",
  water: "border-transparent bg-pokemon-water/20 text-pokemon-water",
  fighting: "border-transparent bg-pokemon-fighting/20 text-pokemon-fighting",
  grass: "border-transparent bg-pokemon-grass/20 text-pokemon-grass",
  ground: "border-transparent bg-pokemon-ground/20 text-pokemon-ground",
  normal: "border-transparent bg-neutral-light/30 text-neutral-dark",
  // Reserve extra palettes for moves/regions if needed later on.
} as const;

export type BadgeTone = keyof typeof toneClasses;

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    tone?: BadgeTone;
  };

function Badge({ className, variant, size, tone, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), tone ? toneClasses[tone] : "", className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
