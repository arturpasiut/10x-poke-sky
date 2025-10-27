import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  // Odśwież sesję przed wysłaniem odpowiedzi
  await supabase.auth.getUser();

  context.locals.supabase = supabase;

  return next();
});
