import { useCallback, useId, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import clsx from "clsx";
import {
  extractFieldErrors,
  forgotPasswordSchema,
  type FieldErrors,
  type ForgotPasswordInput,
} from "@/lib/auth/validation";
import { FormStatusBanner, type StatusMessage } from "./FormStatusBanner";

interface ForgotPasswordFormProps {
  message?: string | null;
}

const INITIAL_VALUES: ForgotPasswordInput = {
  email: "",
};

interface ForgotPasswordResponseBody {
  message?: string;
  fieldErrors?: FieldErrors<typeof forgotPasswordSchema>;
  details?: unknown;
}

export default function ForgotPasswordForm({ message }: ForgotPasswordFormProps) {
  const emailId = useId();

  const [values, setValues] = useState<ForgotPasswordInput>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<typeof forgotPasswordSchema>>({});
  const [status, setStatus] = useState<StatusMessage | null>(message ? { variant: "info", content: message } : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const result = forgotPasswordSchema.safeParse(values);

      if (!result.success) {
        setFieldErrors(extractFieldErrors(result.error));
        setStatus({
          variant: "error",
          content: "Upewnij się, że adres e-mail jest poprawny.",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result.data),
          credentials: "same-origin",
        });

        let payload: ForgotPasswordResponseBody | null = null;

        try {
          payload = (await response.json()) as ForgotPasswordResponseBody;
        } catch {
          payload = null;
        }

        if (response.status === 422 && payload?.fieldErrors) {
          setFieldErrors(payload.fieldErrors ?? {});
          setStatus({
            variant: "error",
            content: payload.message ?? "Upewnij się, że adres e-mail jest poprawny.",
          });
          return;
        }

        if (!response.ok) {
          setStatus({
            variant: "error",
            content: payload?.message ?? "Nie udało się zainicjować resetu hasła. Spróbuj ponownie później.",
          });
          return;
        }

        setValues(INITIAL_VALUES);
        setStatus({
          variant: "success",
          content:
            payload?.message ??
            "Jeśli konto istnieje, wysłaliśmy link resetujący hasło. W środowisku lokalnym wiadomość może nie dotrzeć, ale proces został uruchomiony.",
        });
      } catch {
        setStatus({
          variant: "error",
          content: "Nie udało się zainicjować resetu hasła. Spróbuj ponownie później.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [values]
  );

  return (
    <form className="relative z-10 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Resetuj hasło</h1>
        <p className="text-sm text-muted-foreground">
          Podaj adres e-mail, a prześlemy Ci instrukcję resetu, gdy integracja zostanie ukończona.
        </p>
      </header>

      {status ? <FormStatusBanner status={status} /> : null}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor={emailId}>
          Adres e-mail
        </label>
        <input
          id={emailId}
          className={clsx("auth-input", fieldErrors.email && "border-red-500 focus:border-red-500")}
          type="email"
          name="email"
          placeholder="trainer@pokemon.com"
          value={values.email}
          onChange={handleInputChange}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
          autoComplete="email"
          required
        />
        {fieldErrors.email ? (
          <p id={`${emailId}-error`} className="text-xs text-red-400">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <button className="auth-action" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <a className="text-primary" href="/auth/login">
          ← Wróć do logowania
        </a>
      </p>
    </form>
  );
}
