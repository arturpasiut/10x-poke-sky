import { useCallback, useId, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import clsx from "clsx";
import { extractFieldErrors, registerSchema, type FieldErrors, type RegisterInput } from "@/lib/auth/validation";
import { FormStatusBanner, type StatusMessage } from "./FormStatusBanner";

interface RegisterFormProps {
  message?: string | null;
}

const INITIAL_VALUES: RegisterInput = {
  email: "",
  password: "",
  confirmPassword: "",
};

interface RegisterResponseBody {
  message?: string;
  fieldErrors?: FieldErrors<typeof registerSchema>;
  details?: unknown;
  user?: {
    id: string;
    email: string | null;
  } | null;
  profileInitialized?: boolean;
}

const passwordHints = [
  "Minimum 12 znaków",
  "Przynajmniej jedna wielka i mała litera",
  "Przynajmniej jedna cyfra oraz znak specjalny",
];

export default function RegisterForm({ message }: RegisterFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const [values, setValues] = useState<RegisterInput>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<typeof registerSchema>>({});
  const [status, setStatus] = useState<StatusMessage | null>(message ? { variant: "info", content: message } : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordGuidelines = useMemo(() => passwordHints.join(" • "), []);

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

      const result = registerSchema.safeParse(values);

      if (!result.success) {
        setFieldErrors(extractFieldErrors(result.error));
        setStatus({
          variant: "error",
          content: "Sprawdź wymagania dotyczące hasła i popraw formularz.",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result.data),
          credentials: "same-origin",
        });

        let payload: RegisterResponseBody | null = null;

        try {
          payload = (await response.json()) as RegisterResponseBody;
        } catch {
          payload = null;
        }

        if (response.status === 422 && payload?.fieldErrors) {
          setFieldErrors(payload.fieldErrors ?? {});
          setStatus({
            variant: "error",
            content: payload.message ?? "Sprawdź wymagania dotyczące hasła i popraw formularz.",
          });
          return;
        }

        if (response.status === 409) {
          setStatus({
            variant: "error",
            content: payload?.message ?? "Taki użytkownik już istnieje. Zaloguj się lub użyj innego adresu e-mail.",
          });
          return;
        }

        if (!response.ok) {
          setStatus({
            variant: "error",
            content: payload?.message ?? "Nie udało się utworzyć konta. Spróbuj ponownie później.",
          });
          return;
        }

        setStatus({
          variant: "success",
          content: payload?.message ?? "Konto utworzone pomyślnie! Przenosimy Cię dalej...",
        });

        window.location.assign("/");
      } catch {
        setStatus({
          variant: "error",
          content: "Nie udało się utworzyć konta. Spróbuj ponownie później.",
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
        <h1 className="text-3xl font-semibold">Dołącz do drużyny!</h1>
        <p className="text-sm text-muted-foreground">
          Utwórz konto, aby zapisywać ulubione Pokémony i śledzić postępy.
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
          placeholder="ash@paleta.town"
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

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor={passwordId}>
          Hasło
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
          Powtórz hasło
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

      <button className="auth-action auth-action--secondary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a className="text-primary" href="/auth/login">
          Zaloguj się
        </a>
      </p>
    </form>
  );
}
