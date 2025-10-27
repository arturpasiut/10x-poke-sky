import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.server";
import { extractFieldErrors, loginSchema, type LoginInput } from "@/lib/auth/validation";

export const prerender = false;

const jsonResponse = (body: unknown, init: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

const parseRequestBody = async (request: Request): Promise<LoginInput> => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new Response(
      JSON.stringify({
        message: "Nie udało się odczytać danych żądania.",
      }),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  const result = loginSchema.safeParse(payload);

  if (!result.success) {
    throw new Response(
      JSON.stringify({
        message: "Popraw zaznaczone pola i spróbuj ponownie.",
        fieldErrors: extractFieldErrors(result.error),
      }),
      { status: 422, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  return result.data;
};

const verifyCsrfHeaders = (request: Request) => {
  const originHeader = request.headers.get("origin") ?? request.headers.get("referer");

  if (!originHeader) {
    return true;
  }

  try {
    const requestOrigin = new URL(request.url).origin;
    const headerOrigin = new URL(originHeader).origin;
    return requestOrigin === headerOrigin;
  } catch {
    return false;
  }
};

const INVALID_CREDENTIALS = new Set(["Invalid login credentials", "Email not confirmed"]);

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!verifyCsrfHeaders(request)) {
    return jsonResponse(
      {
        message: "Nieautoryzowane źródło żądania.",
      },
      { status: 403 }
    );
  }

  let data: LoginInput;

  try {
    data = await parseRequestBody(request);
  } catch (response) {
    if (response instanceof Response) {
      return response;
    }
    return jsonResponse(
      {
        message: "Wystąpił nieoczekiwany błąd walidacji.",
      },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient({
    headers: request.headers,
    cookies,
    persistSession: data.rememberMe,
  });

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    const message = INVALID_CREDENTIALS.has(error.message)
      ? "Nieprawidłowy adres e-mail lub hasło."
      : "Nie udało się zalogować. Spróbuj ponownie za chwilę.";

    const status = INVALID_CREDENTIALS.has(error.message) ? 401 : 500;

    return jsonResponse(
      {
        message,
        details: error.message,
      },
      { status }
    );
  }

  return jsonResponse(
    {
      message: "Zalogowano pomyślnie.",
      user: authData.user
        ? {
            id: authData.user.id,
            email: authData.user.email,
          }
        : null,
    },
    { status: 200 }
  );
};
