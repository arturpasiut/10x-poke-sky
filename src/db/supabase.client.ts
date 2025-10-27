import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const publicSupabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
const publicSupabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.PUBLIC_SUPABASE_KEY ??
  import.meta.env.SUPABASE_ANON_KEY ??
  import.meta.env.SUPABASE_KEY;

export const supabaseClient =
  typeof publicSupabaseUrl === "string" &&
  publicSupabaseUrl.length > 0 &&
  typeof publicSupabaseAnonKey === "string" &&
  publicSupabaseAnonKey.length > 0
    ? createClient<Database>(publicSupabaseUrl, publicSupabaseAnonKey)
    : null;
