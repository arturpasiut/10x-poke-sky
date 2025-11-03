import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import clsx from "clsx";

import { supabaseClient } from "@/db/supabase.client";
import {
  extractFieldErrors,
  resetPasswordSchema,
  type FieldErrors,
  type ResetPasswordInput,
} from "@/lib/auth/validation";
import { FormStatusBanner, type StatusMessage } from "./FormStatusBanner";

type VerificationFlow = "recovery" | "signup" | "invite" | "email_change" | "magiclink" | "unknown";
type ViewState = "processing" | "password" | "verified" | "error";

interface ResetPasswordHandlerProps {
  code?: string | null;
  token?: string | null;
  type?: string | null;
  error?: string | null;
  errorDescription?: string | null;
}

const INITIAL_VALUES: ResetPasswordInput = {
  password: "",
  confirmPassword: "",
};

const passwordHints = [
  "Minimum 12 znaków",
  "Przynajmniej jedna wielka i mała litera",
  "Przynajmniej jedna cyfra oraz znak specjalny",
];

const KNOWN_VERIFICATION_TYPES: Record<string, VerificationFlow> = {
  recovery: "recovery",
  signup: "signup",
  invite: "invite",
  email_change: "email_change",
  magiclink: "magiclink",
};

const decodeMessage = (value: string) => {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
};

export default function ResetPasswordHandler({
  code,
  token,
  type,
  error,
  errorDescription,
}: ResetPasswordHandlerProps) {
  const passwordId = useId();
  const confirmId = useId();

  const [view, setView] = useState<ViewState>("processing");
  const [flow, setFlow] = useState<VerificationFlow>("recovery");
  const [values, setValues] = useState<ResetPasswordInput>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<typeof resetPasswordSchema>>({});
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordGuidelines = useMemo(() => passwordHints.join(" • "), []);

  useEffect(() => {
    const configuredClient = supabaseClient;
    const verificationCode = code ?? token ?? null;
    const hasErrorParam = Boolean(error || errorDescription);

    if (hasErrorParam) {
      const message = decodeMessage(errorDescription ?? error ?? "Link jest nieprawidłowy lub wygasł.");
      setStatus({
        variant: "error",
        content: message,
      });
      setView("error");
      return;
    }

    if (!verificationCode) {
      setStatus({
        variant: "error",
        content: "Brakuje kodu weryfikacyjnego w adresie. Poproś o nowy link resetujący hasło.",
      });
      setView("error");
      return;
    }

    if (!configuredClient) {
      setStatus({
        variant: "error",
        content: "Supabase nie jest poprawnie skonfigurowane. Skontaktuj się z administratorem.",
      });
      setView("error");
      return;
    }

    let cancelled = false;
    setStatus({
      variant: "info",
      content: "Weryfikujemy link...",
    });
    setView("processing");

    void configuredClient.auth
      .exchangeCodeForSession(verificationCode)
      .then(({ error: exchangeError }) => {
        if (cancelled) {
          return;
        }

        if (exchangeError) {
          const message = decodeMessage(exchangeError.message ?? "Nie udało się zweryfikować linku.");
          setStatus({
            variant: "error",
            content: message.includes("expired")
              ? "Link wygasł. Poproś o nowy reset hasła."
              : message || "Nie udało się zweryfikować linku.",
          });
          setView("error");
          return;
        }

        const normalizedType = (type ?? "").toLowerCase();
        const resolvedFlow = KNOWN_VERIFICATION_TYPES[normalizedType] ?? "unknown";
        setFlow(resolvedFlow);

        if (resolvedFlow === "recovery") {
          setStatus({
            variant: "info",
            content: "Ustaw nowe hasło dla swojego konta.",
          });
          setView("password");
          return;
        }

        if (resolvedFlow === "magiclink") {
          setStatus({
            variant: "success",
            content: "Link logujący został potwierdzony. Możesz przejść do aplikacji.",
          });
          setView("verified");
          return;
        }

        setStatus({
          variant: "success",
          content:
            resolvedFlow === "signup"
              ? "Adres e-mail został potwierdzony. Możesz zalogować się do aplikacji."
              : resolvedFlow === "email_change"
                ? "Adres e-mail został zaktualizowany."
                : resolvedFlow === "invite"
                  ? "Zaproszenie zostało potwierdzone. Zaloguj się, aby kontynuować."
                  : "Operacja została potwierdzona.",
        });
        setView("verified");
        void configuredClient.auth.signOut();
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setStatus({
          variant: "error",
          content: "Nie udało się zweryfikować linku. Spróbuj ponownie lub poproś o nowy.",
        });
        setView("error");
      });

    return () => {
      cancelled = true;
    };
  }, [code, token, type, error, errorDescription]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setStatus(null);
      setFieldErrors({});

      const result = resetPasswordSchema.safeParse(values);

      if (!result.success) {
        setFieldErrors(extractFieldErrors(result.error));
        setStatus({
          variant: "error",
          content: "Sprawdź wymagania dotyczące hasła i spróbuj ponownie.",
        });
        setIsSubmitting(false);
        return;
      }

      if (!supabaseClient) {
        setStatus({
          variant: "error",
          content: "Supabase nie jest poprawnie skonfigurowane. Spróbuj ponownie później.",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const { error: updateError } = await supabaseClient.auth.updateUser({
          password: result.data.password,
        });

        if (updateError) {
          const message = decodeMessage(updateError.message ?? "Nie udało się ustawić nowego hasła.");
          setStatus({
            variant: "error",
            content: message.includes("Same password")
              ? "Nowe hasło musi być inne niż poprzednie."
              : message || "Nie udało się ustawić nowego hasła.",
          });
          return;
        }

        setValues(INITIAL_VALUES);
        setFieldErrors({});
        setStatus({
          variant: "success",
          content: "Hasło zostało zaktualizowane. Zaloguj się nowym hasłem.",
        });
        setView("verified");
        setFlow("recovery");
        await supabaseClient.auth.signOut();
      } catch {
        setStatus({
          variant: "error",
          content: "Wystąpił nieoczekiwany błąd podczas zapisu hasła. Spróbuj ponownie później.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [values]
  );

  const actionHref = flow === "magiclink" ? "/" : "/auth/login";
  const actionLabel =
    flow === "magiclink"
      ? "Przejdź do aplikacji"
      : flow === "recovery"
        ? "Przejdź do logowania"
        : "Przejdź do logowania";

  return (
    <section className="relative z-10 flex flex-col gap-5">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">
          {view === "password"
            ? "Ustaw nowe hasło"
            : view === "verified"
              ? flow === "signup"
                ? "Konto potwierdzone"
                : flow === "email_change"
                  ? "Adres e-mail zaktualizowany"
                  : flow === "invite"
                    ? "Zaproszenie potwierdzone"
                    : flow === "magiclink"
                      ? "Logowanie potwierdzone"
                      : "Operacja zakończona"
              : view === "error"
                ? "Link jest nieaktywny"
                : "Weryfikacja linku"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {view === "password"
            ? "Wprowadź nowe hasło spełniające wymagania bezpieczeństwa."
            : view === "verified"
              ? flow === "signup"
                ? "Możesz zalogować się na swoje konto i rozpocząć przygodę."
                : flow === "email_change"
                  ? "Twoje dane logowania zostały zaktualizowane. Zaloguj się ponownie, aby kontynuować."
                  : flow === "invite"
                    ? "Zaloguj się, aby dokończyć konfigurację konta."
                    : flow === "magiclink"
                      ? "Sesja została zainicjowana. Możesz przejść do aplikacji."
                      : "Możesz zalogować się do aplikacji."
              : view === "error"
                ? "Link mógł wygasnąć lub został już użyty. Poproś o nowy, jeśli potrzebujesz."
                : "Chwila, trwa potwierdzanie informacji..."}
        </p>
      </header>

      {status ? <FormStatusBanner status={status} /> : null}

      {view === "processing" ? (
        <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--color-border)_60%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-4 py-6 text-center text-sm text-muted-foreground">
          Sprawdzamy dane w linku…
        </div>
      ) : null}

      {view === "password" ? (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor={passwordId}>
              Nowe hasło
            </label>
            <input
              id={passwordId}
              className={clsx("auth-input", fieldErrors.password && "border-red-500 focus:border-red-500")}
              type="password"
              name="password"
              placeholder="••••••••"
              value={values.password}
              onChange={handleInputChange}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? `${passwordId}-error` : `${passwordId}-guidelines`}
              autoComplete="new-password"
              required
            />
            <p id={`${passwordId}-guidelines`} className="text-xs text-muted-foreground">
              {passwordGuidelines}
            </p>
            {fieldErrors.password ? (
              <p id={`${passwordId}-error`} className="text-xs text-red-400">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor={confirmId}>
              Potwierdź hasło
            </label>
            <input
              id={confirmId}
              className={clsx("auth-input", fieldErrors.confirmPassword && "border-red-500 focus:border-red-500")}
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={values.confirmPassword}
              onChange={handleInputChange}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? `${confirmId}-error` : undefined}
              autoComplete="new-password"
              required
            />
            {fieldErrors.confirmPassword ? (
              <p id={`${confirmId}-error`} className="text-xs text-red-400">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          <button className="auth-action auth-action--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : "Zapisz nowe hasło"}
          </button>
        </form>
      ) : null}

      {view === "verified" ? (
        <div className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
          <a className="auth-action auth-action--primary" href={actionHref}>
            {actionLabel}
          </a>
          {flow === "recovery" ? (
            <p>
              Jeśli logowanie się nie powiedzie, poproś o kolejny link resetujący lub skontaktuj się z administratorem.
            </p>
          ) : null}
        </div>
      ) : null}

      {view === "error" ? (
        <div className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
          <a className="auth-action auth-action--secondary" href="/auth/forgot">
            Poproś o nowy link
          </a>
          <p>
            Jeśli problem się powtarza, upewnij się, że używasz najnowszej wiadomości e-mail z linkiem resetującym lub
            potwierdzającym.
          </p>
        </div>
      ) : null}
    </section>
  );
}
