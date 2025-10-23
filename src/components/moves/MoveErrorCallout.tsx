import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/pokemon/types";

interface MoveErrorCalloutProps {
  error: ApiError;
  onRetry: () => void;
  isRetrying?: boolean;
  retryDisabledUntil?: number;
}

export function MoveErrorCallout({ error, onRetry, isRetrying = false, retryDisabledUntil }: MoveErrorCalloutProps) {
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
      className="flex flex-col gap-5 rounded-3xl border border-purple-400/40 bg-purple-500/10 p-8 text-left text-purple-100 shadow-[0_30px_75px_-40px_rgba(168,85,247,0.35)]"
      role="alert"
      aria-live="assertive"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300/80">Błąd: {error.code}</p>
          <h2 className="mt-2 text-2xl font-semibold text-purple-50">Nie udało się załadować listy ruchów</h2>
        </div>
      </header>

      <p className="text-base text-purple-100/80">{error.message}</p>
      {error.details ? <p className="text-sm text-purple-200/70">{error.details}</p> : null}

      <div>
        <Button
          onClick={onRetry}
          disabled={disabled}
          variant="outline"
          className="border-purple-300/70 text-purple-50 hover:bg-purple-400/20"
        >
          {retryLabel}
        </Button>
      </div>
    </section>
  );
}
