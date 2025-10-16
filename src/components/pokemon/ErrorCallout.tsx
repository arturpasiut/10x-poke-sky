import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/pokemon/types";

type ErrorCalloutProps = {
  error: ApiError;
  onRetry: () => void;
  isRetrying?: boolean;
  retryDisabledUntil?: number;
};

export function ErrorCallout({ error, onRetry, isRetrying = false, retryDisabledUntil }: ErrorCalloutProps) {
  const isThrottled = useMemo(() => {
    if (!retryDisabledUntil) {
      return false;
    }

    if (Number.isNaN(retryDisabledUntil)) {
      return false;
    }

    return Date.now() < retryDisabledUntil;
  }, [retryDisabledUntil]);

  const disabled = isRetrying || isThrottled;
  const retryLabel = isRetrying ? "Ponawianie..." : isThrottled ? "Odczekaj chwilę" : "Spróbuj ponownie";

  return (
    <section
      className="flex flex-col gap-5 rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-left text-red-200 shadow-[0_25px_60px_-30px_rgba(255,56,56,0.35)]"
      role="alert"
      aria-live="assertive"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-red-400/80">Błąd: {error.code}</p>
          <h2 className="mt-2 text-2xl font-semibold text-red-100">Nie udało się załadować Pokédexu</h2>
        </div>
      </header>

      <p className="text-base text-red-100/80">{error.message}</p>
      {error.details ? <p className="text-sm text-red-200/70">{error.details}</p> : null}

      <div>
        <Button
          onClick={onRetry}
          disabled={disabled}
          variant="outline"
          className="border-red-400/70 text-red-100 hover:bg-red-400/20"
        >
          {retryLabel}
        </Button>
      </div>
    </section>
  );
}
