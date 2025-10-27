import { AlertCircle, Clock, LogIn, X } from "lucide-react";
import type { FC } from "react";

import { Button } from "@/components/ui/button";
import type { AiChatErrorState } from "@/features/ai-chat";

interface RateLimitAlertProps {
  error: AiChatErrorState;
  onDismiss?: () => void;
  onLoginRedirect?: () => void;
}

const errorTitles: Record<AiChatErrorState["kind"], string> = {
  "rate-limit": "Limit zapytań osiągnięty",
  validation: "Niepoprawny opis",
  unauthorized: "Wymagane logowanie",
  network: "Błąd połączenia",
  server: "Problem po stronie serwera",
  unknown: "Wystąpił błąd",
};

const RateLimitAlert: FC<RateLimitAlertProps> = ({ error, onDismiss, onLoginRedirect }) => {
  const title = error.title ?? errorTitles[error.kind] ?? "Wystąpił błąd";
  const showRetryTimer = error.kind === "rate-limit" && typeof error.retryAfterSeconds === "number";
  const requiresLogin = error.requiresAuthentication && typeof onLoginRedirect === "function";

  return (
    <section
      role="alert"
      className="relative flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground shadow-inner"
    >
      <header className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm leading-relaxed text-destructive/90">{error.message}</p>
          {showRetryTimer && (
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-destructive">
              <Clock className="size-4" aria-hidden="true" />
              Spróbuj ponownie za {error.retryAfterSeconds}s
            </p>
          )}
        </div>
        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            aria-label="Zamknij alert"
            onClick={onDismiss}
          >
            <X className="size-4" />
          </Button>
        )}
      </header>

      <footer className="flex flex-wrap items-center gap-2">
        {requiresLogin ? (
          <Button type="button" variant="secondary" onClick={onLoginRedirect} className="gap-2">
            <LogIn className="size-4" />
            Zaloguj się
          </Button>
        ) : null}
        {error.details ? <p className="text-xs text-destructive/80">{error.details}</p> : null}
      </footer>
    </section>
  );
};

export default RateLimitAlert;
