import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { extractFieldErrors, registerSchema, type RegisterInput } from "@/lib/auth/validation";

export const prerender = false;

const jsonResponse = (body: unknown, init: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

const parseRequestBody = async (request: Request): Promise<RegisterInput> => {
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

  const result = registerSchema.safeParse(payload);

  if (!result.success) {
    throw new Response(
      JSON.stringify({
        message: "Sprawdź wymagania dotyczące hasła i popraw formularz.",
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

const KNOWN_CONFLICT_ERRORS = new Set(["User already registered"]);

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!verifyCsrfHeaders(request)) {
    return jsonResponse(
      {
        message: "Nieautoryzowane źródło żądania.",
      },
      { status: 403 }
    );
  }

  let data: RegisterInput;

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
    request,
    cookies,
  });

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (error) {
    const status = KNOWN_CONFLICT_ERRORS.has(error.message) ? 409 : 500;
    const message = KNOWN_CONFLICT_ERRORS.has(error.message)
      ? "Taki użytkownik już istnieje. Zaloguj się lub użyj innego adresu e-mail."
      : "Nie udało się utworzyć konta. Spróbuj ponownie za chwilę.";

    return jsonResponse(
      {
        message,
        details: error.message,
      },
      { status }
    );
  }

  const user = authData.user;

  if (!user) {
    return jsonResponse(
      {
        message: "Nie udało się utworzyć konta. Spróbuj ponownie.",
      },
      { status: 500 }
    );
  }

  let profileInitialized = true;

  try {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
    });

    if (profileError && profileError.code !== "23505") {
      profileInitialized = false;
    }
  } catch {
    profileInitialized = false;
  }

  return jsonResponse(
    {
      message: profileInitialized
        ? "Konto utworzone pomyślnie."
        : "Konto utworzone, ale nie udało się w pełni zainicjować profilu.",
      user: {
        id: user.id,
        email: user.email,
      },
      profileInitialized,
    },
    { status: 201 }
  );
};
