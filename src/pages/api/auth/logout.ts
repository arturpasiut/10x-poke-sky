import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.server";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient({
    headers: request.headers,
    cookies,
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    const fallbackMessage = encodeURIComponent("Nie udało się wylogować. Spróbuj ponownie.");
    return redirect(`/auth/login?message=${fallbackMessage}`, 303);
  }

  const message = encodeURIComponent("Wylogowano pomyślnie.");
  return redirect(`/auth/login?message=${message}`, 303);
};
