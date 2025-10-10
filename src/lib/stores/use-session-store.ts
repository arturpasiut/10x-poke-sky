import { create } from "zustand"
import type {
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js"

import type { Database } from "@/db/database.types"
import type { UserProfileDto } from "@/types"

export type SessionStatus = "idle" | "loading" | "authenticated" | "unauthenticated"

type SessionStoreState = {
  status: SessionStatus
  session: Session | null
  user: User | null
  profile: UserProfileDto | null
  error: string | null
}

type SessionStoreActions = {
  setStatus: (status: SessionStatus) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfileDto | null) => void
  setError: (message: string | null) => void
  reset: () => void
}

export type SessionStore = SessionStoreState & SessionStoreActions

const initialState: SessionStoreState = {
  status: "idle",
  session: null,
  user: null,
  profile: null,
  error: null,
}

export const useSessionStore = create<SessionStore>()((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? "authenticated" : "unauthenticated",
      error: null,
    }),
  setProfile: (profile) => set({ profile }),
  setError: (message) => set({ error: message }),
  reset: () =>
    set(() => ({
      ...initialState,
      status: "unauthenticated",
    })),
}))

type SupabaseTypedClient = SupabaseClient<Database>

/**
 * Fetch the current Supabase session and update the Zustand store.
 * Consumers should call this once during app bootstrap before rendering
 * session-gated routes.
 */
export const hydrateSession = async (client: SupabaseTypedClient) => {
  const { setStatus, setSession, setError } = useSessionStore.getState()
  setStatus("loading")

  const { data, error } = await client.auth.getSession()

  if (error) {
    setError(error.message)
    setSession(null)
    return null
  }

  setSession(data.session ?? null)
  return data.session ?? null
}

/**
 * Subscribe to Supabase auth state changes and keep the local store in sync.
 * Returns an unsubscribe callback that should be invoked when the listener
 * is no longer needed (e.g., on component unmount).
 */
export const subscribeToAuthChanges = (client: SupabaseTypedClient) => {
  const { setSession } = useSessionStore.getState()

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    setSession(session)
  })

  return () => subscription.unsubscribe()
}
