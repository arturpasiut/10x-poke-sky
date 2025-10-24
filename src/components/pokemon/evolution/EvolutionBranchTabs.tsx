import { memo, useEffect } from "react";

import clsx from "clsx";

import type { EvolutionBranchDto } from "@/lib/evolution/types";
import { useEvolutionStore, selectSelectedBranchId } from "@/stores/useEvolutionStore";

export interface EvolutionBranchTabsProps {
  chainId: string;
  branches: EvolutionBranchDto[];
  className?: string;
}

function Component({ chainId, branches, className }: EvolutionBranchTabsProps) {
  const selectedBranchId = useEvolutionStore(selectSelectedBranchId);
  const setSelectedBranchId = useEvolutionStore((state) => state.setSelectedBranchId);

  const hasBranches = branches.length > 0;

  useEffect(() => {
    if (!hasBranches) {
      setSelectedBranchId(null);
      return;
    }

    const branchIds = branches.map((branch) => branch.id);
    if (selectedBranchId && !branchIds.includes(selectedBranchId)) {
      setSelectedBranchId(null);
    }
  }, [chainId, branches, hasBranches, selectedBranchId, setSelectedBranchId]);

  if (!hasBranches) {
    return null;
  }

  return (
    <nav className={clsx("flex flex-wrap items-center gap-2", className)} aria-label="Ścieżki ewolucji">
      <button
        type="button"
        onClick={() => setSelectedBranchId(null)}
        className={clsx(
          "rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
          selectedBranchId === null
            ? "border-primary/70 bg-primary/20 text-white shadow-lg"
            : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
        )}
      >
        Wszystkie ścieżki
      </button>
      {branches.map((branch) => {
        const isActive = branch.id === selectedBranchId;
        return (
          <button
            key={branch.id}
            type="button"
            onClick={() => setSelectedBranchId(isActive ? null : branch.id)}
            className={clsx(
              "rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
              isActive
                ? "border-primary/70 bg-primary/20 text-white shadow-lg"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
            )}
          >
            {branch.label}
          </button>
        );
      })}
    </nav>
  );
}

export const EvolutionBranchTabs = memo(Component);
