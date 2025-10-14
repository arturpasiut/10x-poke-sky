import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { POKEMON_SORT_OPTIONS } from "@/lib/pokemon/filters"
import {
  MAX_SELECTED_TYPES,
  getGenerationLabel,
  getRegionLabel,
  getTypeLabel,
} from "@/lib/pokemon/filters"
import type {
  ApiError,
  FilterChipViewModel,
  PaginationViewModel,
  PokemonSortKey,
  PokemonSummaryViewModel,
} from "@/lib/pokemon/types"
import { usePokemonFilterOptions } from "@/hooks/usePokemonFilterOptions"
import { usePokemonListQuery } from "@/hooks/usePokemonListQuery"
import { usePokemonSearchStore } from "@/stores/usePokemonSearchStore"

import { EmptyStateWithAI } from "./EmptyStateWithAI"
import { ErrorCallout } from "./ErrorCallout"
import { FilterChips } from "./FilterChips"
import { FilterSidePanel } from "./FilterSidePanel"
import { ListSkeleton } from "./ListSkeleton"
import { MobileFilterDrawer } from "./MobileFilterDrawer"
import { PaginationControls } from "./PaginationControls"
import { PokemonGrid } from "./PokemonGrid"
import { SearchHeader } from "./SearchHeader"
import { SortBar } from "./SortBar"
import { StatusBanner } from "./StatusBanner"

export default function PokemonListingView() {
  const store = usePokemonSearchStore

  const [queryState, setQueryState] = useState(() => {
    const snapshot = store.getState()
    return {
      search: snapshot.search,
      types: snapshot.types,
      generation: snapshot.generation,
      region: snapshot.region,
      sort: snapshot.sort,
      order: snapshot.order,
      page: snapshot.page,
      pageSize: snapshot.pageSize,
    }
  })
  const [isHydrated, setIsHydrated] = useState(() => store.getState().isHydrated)
  const [queryString, setQueryString] = useState(() => store.getState().toQueryString())

  const {
    setSearch,
    toggleType,
    setGeneration,
    setRegion,
    setSort,
    toggleOrder,
    setPage,
    resetFilters,
    resetAll,
    initialiseFromUrl,
    replaceFromUrl,
    commitQuery,
    restoreLastApplied,
  } = useMemo(() => {
    const snapshot = store.getState()
    return {
      setSearch: snapshot.setSearch,
      toggleType: snapshot.toggleType,
      setGeneration: snapshot.setGeneration,
      setRegion: snapshot.setRegion,
      setSort: snapshot.setSort,
      toggleOrder: snapshot.toggleOrder,
      setPage: snapshot.setPage,
      resetFilters: snapshot.resetFilters,
      resetAll: snapshot.resetAll,
      initialiseFromUrl: snapshot.initialiseFromUrl,
      replaceFromUrl: snapshot.replaceFromUrl,
      commitQuery: snapshot.commitQuery,
      restoreLastApplied: snapshot.restoreLastApplied,
    }
  }, [store])

  useEffect(() => {
    const selector = (state: ReturnType<typeof store.getState>) => ({
      query: {
        search: state.search,
        types: state.types,
        generation: state.generation,
        region: state.region,
        sort: state.sort,
        order: state.order,
        page: state.page,
        pageSize: state.pageSize,
      },
      isHydrated: state.isHydrated,
      queryString: state.toQueryString(),
    })

    const initialSlice = selector(store.getState())
    setQueryState(initialSlice.query)
    setIsHydrated(initialSlice.isHydrated)
    setQueryString(initialSlice.queryString)

    const unsubscribe = store.subscribe(selector, (slice) => {
      setQueryState(slice.query)
      setIsHydrated(slice.isHydrated)
      setQueryString(slice.queryString)
    })

    return unsubscribe
  }, [store])

  const { filters } = usePokemonFilterOptions()
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [retryDisabledUntil, setRetryDisabledUntil] = useState<number | undefined>(undefined)
  const [searchDraft, setSearchDraft] = useState(queryState.search)
  const [statusBanner, setStatusBanner] = useState<{
    title: string
    description?: string
    tone?: "info" | "warning"
  } | null>(null)

  useEffect(() => {
    setSearchDraft(queryState.search)
  }, [queryState.search])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    initialiseFromUrl(window.location.search)

    const snapshot = store.getState()
    setQueryState({
      search: snapshot.search,
      types: snapshot.types,
      generation: snapshot.generation,
      region: snapshot.region,
      sort: snapshot.sort,
      order: snapshot.order,
      page: snapshot.page,
      pageSize: snapshot.pageSize,
    })
    setIsHydrated(snapshot.isHydrated)
    setQueryString(snapshot.toQueryString())

    const handlePopState = () => {
      replaceFromUrl(window.location.search)
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [initialiseFromUrl, replaceFromUrl, store])

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return
    }

    const currentSearch = window.location.search.startsWith("?")
      ? window.location.search.slice(1)
      : window.location.search

    if (queryString === currentSearch) {
      return
    }

    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
    window.history.replaceState(null, "", newUrl)
  }, [isHydrated, queryString])

  const queryResult = usePokemonListQuery(queryState, { enabled: isHydrated })
  const { status, data, error, retry, isFetching } = queryResult
  const totalCount = data?.list.total ?? undefined

  useEffect(() => {
    if (status === "success" && data) {
      commitQuery()
      setRetryDisabledUntil(undefined)
      setStatusBanner(null)
    }
  }, [status, data, commitQuery])

  useEffect(() => {
    if (status !== "error" || !error) {
      return
    }

    if (error.code === 400) {
      setStatusBanner({
        tone: "warning",
        title: "Nieprawidłowe filtry",
        description: error.message ?? "Przywrócono ostatnie poprawne parametry.",
      })
      restoreLastApplied()
      return
    }

    if (error.code === 429) {
      if (error.retryAfterMs) {
        setRetryDisabledUntil(Date.now() + error.retryAfterMs)
      }
      setStatusBanner({
        tone: "warning",
        title: "Przekroczono limit zapytań",
        description: error.message,
      })
      return
    }

    setStatusBanner({
      tone: "info",
      title: "Nie udało się odświeżyć Pokédexu",
      description: error.message,
    })
  }, [status, error, restoreLastApplied])

  const filterChips = useMemo<FilterChipViewModel[]>(() => {
    const chips: FilterChipViewModel[] = []

    for (const type of queryState.types) {
      chips.push({
        id: `type:${type}`,
        label: getTypeLabel(type),
        onRemove: () => toggleType(type),
      })
    }

    if (queryState.generation) {
      chips.push({
        id: `generation:${queryState.generation}`,
        label: getGenerationLabel(queryState.generation),
        onRemove: () => setGeneration(null),
      })
    }

    if (queryState.region) {
      chips.push({
        id: `region:${queryState.region}`,
        label: getRegionLabel(queryState.region),
        onRemove: () => setRegion(null),
      })
    }

    return chips
  }, [queryState.types, queryState.generation, queryState.region, toggleType, setGeneration, setRegion])

  const reachedTypeLimit = queryState.types.length === MAX_SELECTED_TYPES

  const handleRetry = () => {
    if (error?.retryAfterMs) {
      setRetryDisabledUntil(Date.now() + error.retryAfterMs)
    }
    retry()
  }

  const showEmptyState = status === "success" && (data?.items?.length ?? 0) === 0

  return (
    <section className="space-y-8 pb-20">
      <SearchHeader
        search={searchDraft}
        total={totalCount}
        onSearchChange={setSearchDraft}
        onSubmit={() => {
          const draft = searchDraft.trim()
          if (draft === queryState.search) {
            retry()
            return
          }
          setSearch(draft)
        }}
        onReset={() => {
          setSearchDraft("")
          resetAll()
          retry()
        }}
        isLoading={isFetching && !data}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-white/20 bg-transparent px-5 py-2 text-sm text-white hover:bg-white/10"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isDrawerOpen}
        >
          Otwórz filtry
        </Button>

        <SortBar
          options={POKEMON_SORT_OPTIONS}
          value={queryState.sort}
          order={queryState.order}
          onValueChange={(value: PokemonSortKey) => setSort(value)}
          onToggleOrder={toggleOrder}
          disabled={isFetching}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <FilterSidePanel
            filters={filters}
            selectedTypes={queryState.types}
            selectedGeneration={queryState.generation}
            selectedRegion={queryState.region}
            onToggleType={toggleType}
            onSelectGeneration={setGeneration}
            onSelectRegion={setRegion}
            onResetFilters={resetFilters}
          />
        </div>

        <div className="space-y-6">
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <FilterChips chips={filterChips} onClearAll={filterChips.length ? resetFilters : undefined} />
            <SortBar
              options={POKEMON_SORT_OPTIONS}
              value={queryState.sort}
              order={queryState.order}
              onValueChange={(value: PokemonSortKey) => setSort(value)}
              onToggleOrder={toggleOrder}
              disabled={isFetching}
            />
          </div>

          <div className="lg:hidden">
            <FilterChips chips={filterChips} onClearAll={filterChips.length ? resetFilters : undefined} />
          </div>

          {statusBanner ? (
            <StatusBanner
              title={statusBanner.title}
              description={statusBanner.description}
              tone={statusBanner.tone}
              onDismiss={() => setStatusBanner(null)}
            />
          ) : null}

          {reachedTypeLimit ? (
            <StatusBanner
              title="Osiągnięto limit typów"
              description="Możesz wybrać maksymalnie trzy typy Pokémonów do jednoczesnego filtrowania."
            />
          ) : null}

          <ContentSwitch
            status={status}
            isFetching={isFetching}
            items={data?.items ?? []}
            pagination={data?.pagination}
            onRetry={handleRetry}
            error={error}
            retryDisabledUntil={retryDisabledUntil}
            onPageChange={setPage}
          />
        </div>
      </div>

      <MobileFilterDrawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <FilterSidePanel
          variant="drawer"
          filters={filters}
          selectedTypes={queryState.types}
          selectedGeneration={queryState.generation}
          selectedRegion={queryState.region}
          onToggleType={(value) => {
            toggleType(value)
          }}
          onSelectGeneration={(value) => {
            setGeneration(value)
          }}
          onSelectRegion={(value) => {
            setRegion(value)
          }}
          onResetFilters={() => {
            resetFilters()
          }}
          onClose={() => setDrawerOpen(false)}
        />
      </MobileFilterDrawer>

      {showEmptyState ? (
        <EmptyStateWithAI ctaLabel="Zapytaj AI" onCta={() => (window.location.href = "/ai")} />
      ) : null}
    </section>
  )
}

type ContentSwitchProps = {
  status: "idle" | "loading" | "success" | "error"
  isFetching: boolean
  items: PokemonSummaryViewModel[]
  pagination: PaginationViewModel | undefined
  onRetry: () => void
  error?: ApiError
  retryDisabledUntil?: number
  onPageChange: (page: number) => void
}

function ContentSwitch({
  status,
  isFetching,
  items,
  pagination,
  onRetry,
  error,
  retryDisabledUntil,
  onPageChange,
}: ContentSwitchProps) {
  if (status === "loading" && !items.length) {
    return <ListSkeleton />
  }

  if (status === "error" && error) {
    return <ErrorCallout error={error} onRetry={onRetry} retryDisabledUntil={retryDisabledUntil} />
  }

  if (items.length) {
    return (
      <>
        <PokemonGrid items={items} aria-busy={isFetching} />
        {pagination ? (
          <PaginationControls pagination={pagination} onPageChange={onPageChange} isLoading={isFetching} />
        ) : null}
      </>
    )
  }

  if (status === "loading") {
    return <ListSkeleton />
  }

  if (status === "success") {
    return null
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0e1621]/60 p-12 text-center text-white/70">
      <p>Brak wyników do wyświetlenia.</p>
    </div>
  )
}
