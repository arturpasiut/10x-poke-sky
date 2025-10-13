import { useCallback, useId, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import clsx from "clsx";
import { extractFieldErrors, loginSchema, type FieldErrors, type LoginInput } from "@/lib/auth/validation";
import { FormStatusBanner, type StatusMessage } from "./FormStatusBanner";

interface LoginFormProps {
  redirectTo?: string | null;
  message?: string | null;
}

const INITIAL_VALUES: LoginInput = {
  email: "",
  password: "",
  rememberMe: false,
};

export default function LoginForm({ redirectTo, message }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();

  const [values, setValues] = useState<LoginInput>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<typeof loginSchema>>({});
  const [status, setStatus] = useState<StatusMessage | null>(message ? { variant: "info", content: message } : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectHint = useMemo(() => {
    if (!redirectTo) {
      return null;
    }
    if (redirectTo === "/") {
      return "Po zalogowaniu wrócisz na stronę główną.";
    }
    return `Po zalogowaniu wrócisz do: ${redirectTo}`;
  }, [redirectTo]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  }, []);

  const handleCheckboxChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setValues((previous) => ({
      ...previous,
      [name]: checked,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setStatus(null);
      setFieldErrors({});

      const result = loginSchema.safeParse(values);

      if (!result.success) {
        setFieldErrors(extractFieldErrors(result.error));
        setStatus({
          variant: "error",
          content: "Popraw zaznaczone pola i spróbuj ponownie.",
        });
        setIsSubmitting(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
      setStatus({
        variant: "success",
        content: "Dane wyglądają poprawnie. Integracja logowania z backendem zostanie dodana w kolejnych krokach.",
      });
      setIsSubmitting(false);
    },
    [values]
  );

  return (
    <form className="relative z-10 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Witaj ponownie!</h1>
        <p className="text-sm text-muted-foreground">Zaloguj się, aby kontynuować swoją przygodę z Pokédexem.</p>
        {redirectHint ? <p className="text-xs text-muted-foreground/90">{redirectHint}</p> : null}
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
          placeholder="misty@pokemon.com"
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
          aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
          autoComplete="current-password"
          required
        />
        {fieldErrors.password ? (
          <p id={`${passwordId}-error`} className="text-xs text-red-400">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2" htmlFor={rememberId}>
          <input
            id={rememberId}
            type="checkbox"
            name="rememberMe"
            className="size-4 rounded border border-[color:color-mix(in_srgb,var(--color-border)_60%,transparent)]"
            checked={values.rememberMe}
            onChange={handleCheckboxChange}
          />
          Zapamiętaj mnie
        </label>
        <a className="text-primary" href="/auth/forgot">
          Zapomniałem hasła
        </a>
      </div>

      <button className="auth-action" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a className="text-primary" href="/auth/register">
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}
