import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import type { PaginationViewModel } from "@/lib/pokemon/types"

type PaginationControlsProps = {
  pagination: PaginationViewModel
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function PaginationControls({ pagination, onPageChange, isLoading = false }: PaginationControlsProps) {
  const { page, pageCount, hasNext, hasPrevious } = pagination
  const [inputValue, setInputValue] = useState(() => String(page))

  useEffect(() => {
    setInputValue(String(page))
  }, [page])

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      onPageChange(page - 1)
    }
  }, [hasPrevious, onPageChange, page])

  const handleNext = useCallback(() => {
    if (hasNext) {
      onPageChange(page + 1)
    }
  }, [hasNext, onPageChange, page])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const parsed = Number.parseInt(inputValue, 10)
      if (!Number.isFinite(parsed)) {
        return
      }
      if (parsed < 1 || (pageCount > 0 && parsed > pageCount)) {
        return
      }

      onPageChange(parsed)
    },
    [inputValue, onPageChange, pageCount],
  )

  const helperText = useMemo(() => {
    if (pageCount <= 0) {
      return "Brak wyników do paginacji"
    }
    return `Strona ${page} z ${pageCount}`
  }, [page, pageCount])

  return (
    <nav
      aria-label="Nawigacja po stronach"
      className="mt-10 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#121a26]/60 p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <p className="text-sm text-white/60">{helperText}</p>

      {pageCount > 1 ? (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" disabled={!hasPrevious || isLoading} onClick={handlePrevious}>
            Poprzednia
          </Button>

          <label className="flex items-center gap-2 text-sm text-white/70">
            <span className="hidden sm:inline">Strona</span>
            <input
              type="number"
              min={1}
              max={pageCount}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onBlur={() => setInputValue(String(page))}
              className="h-10 w-20 rounded-lg border border-white/10 bg-[#0f151c] px-3 text-center text-base text-white outline-none focus:border-primary-400 focus:focus-outline"
              aria-label="Numer strony"
              disabled={isLoading}
            />
            <span className="text-white/50">/ {pageCount}</span>
          </label>

          <Button type="submit" variant="secondary" disabled={isLoading}>
            Przejdź
          </Button>

          <Button type="button" variant="outline" disabled={!hasNext || isLoading} onClick={handleNext}>
            Następna
          </Button>
        </form>
      ) : null}
    </nav>
  )
}
