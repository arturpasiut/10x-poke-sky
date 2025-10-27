import { config, handleOptions, jsonResponse } from "../_shared/config.ts";
import { fetchPokemonList } from "../_shared/pokeapi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const offset = Number(url.searchParams.get("offset") ?? "0");

  try {
    const data = await fetchPokemonList({ limit, offset });
    return jsonResponse({
      source: config.useMock ? "mock" : "pokeapi",
      data,
    });
  } catch (error) {
    console.error("pokemon-list error", error);
    return jsonResponse(
      {
        error: "Failed to fetch Pokemon list",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});
