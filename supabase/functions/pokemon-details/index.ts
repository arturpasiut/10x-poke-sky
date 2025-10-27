import { config, handleOptions, jsonResponse } from "../_shared/config.ts";
import { fetchPokemonDetails } from "../_shared/pokeapi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(req.url);
  const identifier = url.searchParams.get("identifier");

  if (!identifier) {
    return jsonResponse({ error: "Missing identifier query parameter" }, { status: 400 });
  }

  try {
    const data = await fetchPokemonDetails(identifier);
    return jsonResponse({
      source: config.useMock ? "mock" : "pokeapi",
      data,
    });
  } catch (error) {
    console.error("pokemon-details error", error);
    return jsonResponse(
      {
        error: "Failed to fetch Pokemon details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});
