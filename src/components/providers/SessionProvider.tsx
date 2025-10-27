import { useEffect } from "react";

import { supabaseClient } from "@/db/supabase.client";
import { hydrateSession, subscribeToAuthChanges, useSessionStore } from "@/lib/stores/use-session-store";

interface SessionProviderProps {
  initialSession?: { userId: string; email: string } | null;
}

export function SessionProvider({ initialSession }: SessionProviderProps) {
  useEffect(() => {
    // If we have initial session from server, set it immediately and trust it
    if (initialSession) {
      useSessionStore.getState().setStatus("authenticated");
      // Don't hydrate or subscribe from client-side if we have server-side session
      // Server-side cookies are the source of truth
      // Client-side Supabase doesn't have access to httpOnly cookies anyway
      return; // Early return - no cleanup needed
    }

    // Only for unauthenticated users, try to hydrate from client
    useSessionStore.getState().setStatus("unauthenticated");

    if (!supabaseClient) {
      console.error("[SessionProvider] Supabase client is not configured");
      return;
    }

    // Only hydrate and subscribe if no server-side session
    hydrateSession(supabaseClient);

    const unsubscribe = subscribeToAuthChanges(supabaseClient);

    return () => {
      unsubscribe();
    };
  }, [initialSession]);

  return null;
}
