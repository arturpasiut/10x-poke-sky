import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.server.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient({
    headers: context.request.headers,
    cookies: context.cookies,
  });

  // Odśwież sesję przed wysłaniem odpowiedzi
  await supabase.auth.getUser();

  context.locals.supabase = supabase;

  return next();
});
