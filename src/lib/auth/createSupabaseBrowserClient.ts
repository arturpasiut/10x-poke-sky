import { createBrowserClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase browser credentials. Check SUPABASE_URL and SUPABASE_KEY.");
}

export const supabaseBrowserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey);
