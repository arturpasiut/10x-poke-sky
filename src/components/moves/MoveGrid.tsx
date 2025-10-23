import type { MoveSummaryViewModel } from "@/lib/moves/types";

import { MoveCard } from "./MoveCard";

interface MoveGridProps {
  items: MoveSummaryViewModel[];
}

export function MoveGrid({ items }: MoveGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((move) => (
        <MoveCard key={move.moveId} move={move} />
      ))}
    </div>
  );
}
