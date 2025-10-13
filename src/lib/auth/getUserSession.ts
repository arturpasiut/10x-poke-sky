import type { AstroGlobal } from "astro";

import { useSessionStore } from "@/lib/stores/use-session-store";

import { createSupabaseServerClient } from "./createSupabaseServerClient";

export const getUserSession = async (context: AstroGlobal) => {
  const supabase = createSupabaseServerClient({ context });
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[auth] getSession failed", error.message);
    useSessionStore.getState().setError(error.message);
    useSessionStore.getState().setSession(null);
    return null;
  }

  useSessionStore.getState().setSession(session);
  return session;
};
