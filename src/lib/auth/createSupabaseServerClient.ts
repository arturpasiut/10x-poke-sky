import type { AstroGlobal } from "astro";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";

export const createSupabaseServerClient = (context: AstroGlobal): SupabaseClient<Database> => {
  if (context.locals.supabase) {
    return context.locals.supabase as SupabaseClient<Database>;
  }

  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are missing. Ensure SUPABASE_URL and SUPABASE_KEY are configured.");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  context.locals.supabase = supabase;
  return supabase;
};
