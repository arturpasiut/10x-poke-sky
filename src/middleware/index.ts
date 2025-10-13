import { defineMiddleware } from "astro:middleware";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";

export const onRequest = defineMiddleware((context, next) => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[middleware] Missing Supabase credentials. Check SUPABASE_URL i SUPABASE_KEY.");
    return next();
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  context.locals.supabase = supabase;
  context.locals.supabaseUrl = supabaseUrl;
  context.locals.supabaseKey = supabaseKey;

  return next();
});
