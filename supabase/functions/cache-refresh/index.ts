/* eslint-disable no-console -- schedule-triggered function logs for observability */
import { handleOptions, jsonResponse } from "../_shared/config.ts";
import { CACHE_TTL_MS } from "../_shared/constants.ts";
import { fetchAndRefreshMoves, hydratePokemonDetail, getPokemonCacheRowBy } from "../_shared/pokemon-cache.ts";
import { supabaseAdminClient } from "../_shared/supabase-client.ts";
import type { PokemonCacheRow } from "../_shared/types.ts";

const cronSecret = Deno.env.get("CACHE_REFRESH_TOKEN");
const DEFAULT_BATCH_SIZE = 20;

if (!cronSecret) {
  console.warn("CACHE_REFRESH_TOKEN not set. cache-refresh function will reject requests.");
}

type TargetType = "pokemon" | "move";

interface CacheRefreshTarget {
  id: number;
  target_type: TargetType;
  target_id: number;
  label: string | null;
  priority: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  if (!cronSecret) {
    return jsonResponse({ error: "CACHE_REFRESH_TOKEN missing" }, { status: 500 });
  }

  const providedSecret = extractSecret(req.headers);
  if (providedSecret !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: targets, error } = await supabaseAdminClient
      .from("cache_refresh_targets")
      .select("id, target_type, target_id, label, priority")
      .eq("active", true)
      .order("priority", { ascending: false })
      .limit(DEFAULT_BATCH_SIZE);

    if (error) {
      throw error;
    }

    const pokemonIds: number[] = [];
    const moveIds: number[] = [];

    targets?.forEach((target) => {
      if (target.target_type === "pokemon") {
        pokemonIds.push(target.target_id);
      } else if (target.target_type === "move") {
        moveIds.push(target.target_id);
      }
    });

    const pokemonResult = await refreshPokemonTargets(pokemonIds);
    const moveResult = await refreshMoveTargets(moveIds);

    if (targets && targets.length > 0) {
      await supabaseAdminClient
        .from("cache_refresh_targets")
        .update({ last_refreshed: new Date().toISOString() })
        .in(
          "id",
          targets.map((target) => target.id)
        );
    }

    return jsonResponse({
      ok: true,
      meta: {
        pokemonRequested: pokemonIds.length,
        pokemonRefreshed: pokemonResult.refreshed,
        moveRequested: moveIds.length,
        moveRefreshed: moveResult.refreshed,
        cacheTtlMs: CACHE_TTL_MS,
      },
    });
  } catch (error) {
    console.error("cache-refresh error", error);
    return jsonResponse(
      {
        error: "Cache refresh failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

function extractSecret(headers: Headers) {
  const authHeader = headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  const headerToken = headers.get("x-cache-refresh-token")?.trim();
  return headerToken ?? null;
}

async function refreshPokemonTargets(ids: number[]) {
  if (ids.length === 0) {
    return { refreshed: 0 };
  }

  let refreshedCount = 0;

  for (const id of ids) {
    let existing: PokemonCacheRow | null = null;
    try {
      existing = await getPokemonCacheRowBy("pokemon_id", id);
    } catch (error) {
      console.warn("Failed to read cache row", id, error);
    }

    try {
      const { refreshed } = await hydratePokemonDetail(String(id), existing);
      if (refreshed) {
        refreshedCount += 1;
      }
    } catch (error) {
      console.error("Failed to hydrate pokemon", id, error);
    }
  }

  return { refreshed: refreshedCount };
}

async function refreshMoveTargets(ids: number[]) {
  if (ids.length === 0) {
    return { refreshed: 0 };
  }

  try {
    await fetchAndRefreshMoves(ids);
    return { refreshed: ids.length };
  } catch (error) {
    console.error("Failed to refresh moves", ids, error);
    return { refreshed: 0 };
  }
}
