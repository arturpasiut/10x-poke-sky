import { useEffect, useMemo, useState } from "react";

import { useStore } from "zustand";

import { MoveEmptyState } from "./MoveEmptyState";
import { MoveErrorCallout } from "./MoveErrorCallout";
import { MoveFilterChips } from "./MoveFilterChips";
import { MoveFilterPanel } from "./MoveFilterPanel";
import { MoveGrid } from "./MoveGrid";
import { MoveListSkeleton } from "./MoveListSkeleton";
import { MoveSearchHeader } from "./MoveSearchHeader";
import { MoveSortBar } from "./MoveSortBar";
import { MobileFilterDrawer } from "@/components/pokemon/MobileFilterDrawer";
import { PaginationControls } from "@/components/pokemon/PaginationControls";
import { StatusBanner } from "@/components/pokemon/StatusBanner";
import { useMoveFilterOptions } from "@/hooks/useMoveFilterOptions";
import { useMoveListQuery } from "@/hooks/useMoveListQuery";
import {
  selectMoveIsHydrated,
  selectMoveQueryState,
  selectMoveQueryString,
  useMoveSearchStore,
} from "@/stores/useMoveSearchStore";
import { getTypeLabel, getRegionLabel } from "@/lib/pokemon/filters";
import { MOVE_DAMAGE_CLASS_LABELS } from "@/lib/moves/constants";

interface StatusMessage {
  title: string;
  description?: string;
  tone?: "info" | "warning";
}

export function MoveListingView() {
  /* eslint-disable react-compiler/react-compiler */
  const queryState = useStore(useMoveSearchStore, selectMoveQueryState);
  const isHydrated = useStore(useMoveSearchStore, selectMoveIsHydrated);
  const queryString = useStore(useMoveSearchStore, selectMoveQueryString);
  const {
    initialiseFromUrl,
    replaceFromUrl,
    setSearch,
    toggleType,
    toggleDamageClass,
    setRegion,
    setSort,
    toggleOrder,
    setPage,
    setMinPower,
    setMaxPower,
    resetFilters,
    resetAll,
    commitQuery,
    restoreLastApplied,
  } = useStore(useMoveSearchStore, (state) => ({
    initialiseFromUrl: state.initialiseFromUrl,
    replaceFromUrl: state.replaceFromUrl,
    setSearch: state.setSearch,
    toggleType: state.toggleType,
    toggleDamageClass: state.toggleDamageClass,
    setRegion: state.setRegion,
    setSort: state.setSort,
    toggleOrder: state.toggleOrder,
    setPage: state.setPage,
    setMinPower: state.setMinPower,
    setMaxPower: state.setMaxPower,
    resetFilters: state.resetFilters,
    resetAll: state.resetAll,
    commitQuery: state.commitQuery,
    restoreLastApplied: state.restoreLastApplied,
  }));
  /* eslint-enable react-compiler/react-compiler */

  const { filters } = useMoveFilterOptions();
  const [searchDraft, setSearchDraft] = useState(queryState.search);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [retryDisabledUntil, setRetryDisabledUntil] = useState<number | undefined>(undefined);
  const [statusBanner, setStatusBanner] = useState<StatusMessage | null>(null);

  useEffect(() => {
    setSearchDraft(queryState.search);
  }, [queryState.search]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    initialiseFromUrl(window.location.search);

    const handlePopState = () => {
      replaceFromUrl(window.location.search);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [initialiseFromUrl, replaceFromUrl]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    const currentSearch = window.location.search.startsWith("?")
      ? window.location.search.slice(1)
      : window.location.search;

    if (queryString === currentSearch) {
      return;
    }

    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [isHydrated, queryString]);

  const queryResult = useMoveListQuery(queryState, { enabled: isHydrated });
  const { status, data, error, isFetching, retry } = queryResult;

  useEffect(() => {
    if (status === "success" && data) {
      commitQuery();
      setRetryDisabledUntil(undefined);
      setStatusBanner(null);
    }
  }, [status, data, commitQuery]);

  useEffect(() => {
    if (status !== "error" || !error) {
      return;
    }

    if (error.code === 400) {
      setStatusBanner({
        title: "Nieprawidłowe ustawienia filtrów",
        description: error.message ?? "Przywrócono ostatnie poprawne parametry wyszukiwania.",
        tone: "warning",
      });
      restoreLastApplied();
      return;
    }

    if (error.code === 429) {
      if (error.retryAfterMs) {
        setRetryDisabledUntil(Date.now() + error.retryAfterMs);
      }
      setStatusBanner({
        title: "Przekroczono limit zapytań",
        description: error.message,
        tone: "warning",
      });
      return;
    }

    setStatusBanner({
      title: "Nie udało się odświeżyć listy ruchów",
      description: error.message,
      tone: "info",
    });
  }, [status, error, restoreLastApplied]);

  const hasActiveFilters = useMemo(() => {
    return (
      queryState.types.length > 0 ||
      queryState.region !== null ||
      queryState.minPower !== null ||
      queryState.maxPower !== null ||
      queryState.damageClasses.length > 0
    );
  }, [
    queryState.damageClasses.length,
    queryState.maxPower,
    queryState.minPower,
    queryState.region,
    queryState.types.length,
  ]);

  const filterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];

    for (const type of queryState.types) {
      chips.push({
        id: `type:${type}`,
        label: getTypeLabel(type),
        onRemove: () => toggleType(type),
      });
    }

    for (const damageClass of queryState.damageClasses) {
      chips.push({
        id: `damageClass:${damageClass}`,
        label: MOVE_DAMAGE_CLASS_LABELS[damageClass] ?? damageClass,
        onRemove: () => toggleDamageClass(damageClass),
      });
    }

    if (queryState.region) {
      chips.push({
        id: `region:${queryState.region}`,
        label: getRegionLabel(queryState.region),
        onRemove: () => setRegion(null),
      });
    }

    if (queryState.minPower !== null) {
      chips.push({
        id: `minPower:${queryState.minPower}`,
        label: `Moc ≥ ${queryState.minPower}`,
        onRemove: () => setMinPower(null),
      });
    }

    if (queryState.maxPower !== null) {
      chips.push({
        id: `maxPower:${queryState.maxPower}`,
        label: `Moc ≤ ${queryState.maxPower}`,
        onRemove: () => setMaxPower(null),
      });
    }

    return chips;
  }, [
    queryState.damageClasses,
    queryState.maxPower,
    queryState.minPower,
    queryState.region,
    queryState.types,
    setRegion,
    setMaxPower,
    setMinPower,
    toggleDamageClass,
    toggleType,
  ]);

  const handleApplySearch = () => {
    setSearch(searchDraft);
    setPage(1);
  };

  const handleClearAll = () => {
    resetAll();
    setSearchDraft("");
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const content = useMemo(() => {
    if (status === "loading" && !data) {
      return <MoveListSkeleton />;
    }

    if (status === "error" && error) {
      return (
        <MoveErrorCallout
          error={error}
          onRetry={retry}
          retryDisabledUntil={retryDisabledUntil}
          isRetrying={isFetching}
        />
      );
    }

    if (data && data.items.length === 0) {
      return <MoveEmptyState onResetFilters={resetFilters} />;
    }

    if (data) {
      return <MoveGrid items={data.items} />;
    }

    return <MoveListSkeleton />;
  }, [data, error, isFetching, resetFilters, retry, retryDisabledUntil, status]);

  return (
    <div className="flex flex-col gap-8">
      <MoveSearchHeader
        searchValue={searchDraft}
        onSearchChange={setSearchDraft}
        onSubmit={handleApplySearch}
        onResetAll={handleClearAll}
        onOpenFilters={() => setDrawerOpen(true)}
        hasActiveFilters={hasActiveFilters || searchDraft.trim().length > 0}
        isLoading={status === "loading" && !data}
      />

      {statusBanner ? (
        <StatusBanner
          title={statusBanner.title}
          description={statusBanner.description}
          tone={statusBanner.tone}
          onDismiss={() => setStatusBanner(null)}
        />
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[320px,1fr]">
        <div className="hidden xl:block">
          <MoveFilterPanel
            filters={filters}
            selectedTypes={queryState.types}
            selectedDamageClasses={queryState.damageClasses}
            selectedRegion={queryState.region}
            minPower={queryState.minPower}
            maxPower={queryState.maxPower}
            sortKey={queryState.sort}
            onToggleType={toggleType}
            onToggleDamageClass={toggleDamageClass}
            onSelectRegion={setRegion}
            onMinPowerChange={setMinPower}
            onMaxPowerChange={setMaxPower}
            onResetFilters={resetFilters}
            onSortChange={setSort}
          />
        </div>

        <section className="flex flex-col gap-6">
          <MoveFilterChips chips={filterChips} onClearAll={hasActiveFilters ? resetFilters : undefined} />

          <div className="flex flex-col gap-4">
            <MoveSortBar
              value={queryState.sort}
              order={queryState.order}
              onValueChange={setSort}
              onToggleOrder={toggleOrder}
              disabled={status === "loading" && !data}
            />

            {content}

            {data && data.pagination.pageCount > 0 ? (
              <PaginationControls pagination={data.pagination} onPageChange={handlePageChange} isLoading={isFetching} />
            ) : null}
          </div>
        </section>
      </div>

      <MobileFilterDrawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <MoveFilterPanel
          filters={filters}
          selectedTypes={queryState.types}
          selectedDamageClasses={queryState.damageClasses}
          selectedRegion={queryState.region}
          minPower={queryState.minPower}
          maxPower={queryState.maxPower}
          sortKey={queryState.sort}
          onToggleType={toggleType}
          onToggleDamageClass={toggleDamageClass}
          onSelectRegion={setRegion}
          onMinPowerChange={setMinPower}
          onMaxPowerChange={setMaxPower}
          onResetFilters={resetFilters}
          onSortChange={setSort}
          onClose={() => setDrawerOpen(false)}
          variant="drawer"
        />
      </MobileFilterDrawer>
    </div>
  );
}
