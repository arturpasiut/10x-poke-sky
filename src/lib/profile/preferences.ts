import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import type { EvolutionAssetPreference } from "@/lib/evolution/types";
import { supabaseClient } from "@/db/supabase.client";

type SupabaseServerClient = SupabaseClient<Database>;

interface ProfileMetadata {
  evolutionAssetPreference?: EvolutionAssetPreference;
  [key: string]: unknown;
}

interface PreferencesState {
  evolutionAssetPreference: EvolutionAssetPreference | null;
}

const parsePreferences = (metadata: unknown): PreferencesState => {
  if (!metadata || typeof metadata !== "object") {
    return {
      evolutionAssetPreference: null,
    };
  }

  const record = metadata as Record<string, unknown>;
  const value = record.evolutionAssetPreference ?? record.evolution_asset_preference;

  if (value === "gif" || value === "sprite") {
    return {
      evolutionAssetPreference: value,
    };
  }

  return {
    evolutionAssetPreference: null,
  };
};

export const fetchEvolutionAssetPreference = async (
  supabase: SupabaseServerClient
): Promise<EvolutionAssetPreference | null> => {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    if (error) {
      console.warn("[profile.preferences] getUser failed", error);
    }
    return null;
  }

  const preferences = parsePreferences(data.user.user_metadata);
  return preferences.evolutionAssetPreference;
};

export const upsertEvolutionAssetPreference = async (
  supabase: SupabaseServerClient,
  preference: EvolutionAssetPreference
): Promise<void> => {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    if (error) {
      console.warn("[profile.preferences] getUser failed before update", error);
    }
    return;
  }

  const currentMetadata = (data.user.user_metadata ?? {}) as ProfileMetadata;

  const nextMetadata: ProfileMetadata = {
    ...currentMetadata,
    evolutionAssetPreference: preference,
  };

  const { error: updateError } = await supabase.auth.updateUser({
    data: nextMetadata,
  });

  if (updateError) {
    console.warn("[profile.preferences] Failed to update evolution asset preference", updateError);
  }
};

export const upsertEvolutionAssetPreferenceClient = async (preference: EvolutionAssetPreference): Promise<void> => {
  if (!supabaseClient) {
    return;
  }

  try {
    const { error } = await supabaseClient.auth.updateUser({
      data: {
        evolutionAssetPreference: preference,
      },
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn("[profile.preferences] Client update of asset preference failed", error);
  }
};
