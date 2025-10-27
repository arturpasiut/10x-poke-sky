import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.server";
import { extractFieldErrors, forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/auth/validation";

export const prerender = false;

const jsonResponse = (body: unknown, init: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

const parseRequestBody = async (request: Request): Promise<ForgotPasswordInput> => {
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

  const result = forgotPasswordSchema.safeParse(payload);

  if (!result.success) {
    throw new Response(
      JSON.stringify({
        message: "Upewnij się, że adres e-mail jest poprawny.",
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

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!verifyCsrfHeaders(request)) {
    return jsonResponse(
      {
        message: "Nieautoryzowane źródło żądania.",
      },
      { status: 403 }
    );
  }

  let data: ForgotPasswordInput;

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
  });

  const origin = new URL(request.url).origin;

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${origin}/auth/reset`,
  });

  if (error) {
    return jsonResponse(
      {
        message: "Nie udało się zainicjować resetu hasła. Spróbuj ponownie później.",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return jsonResponse(
    {
      message:
        "Jeśli konto istnieje, wysłaliśmy link resetujący hasło. W środowisku lokalnym wiadomość może nie dotrzeć, ale proces został uruchomiony.",
    },
    { status: 200 }
  );
};
