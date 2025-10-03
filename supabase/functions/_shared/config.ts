const DEFAULT_POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";

function toBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

export const config = {
  pokeApiBaseUrl: Deno.env.get("POKEAPI_BASE_URL") ?? DEFAULT_POKEAPI_BASE_URL,
  useMock: toBoolean(Deno.env.get("USE_POKEAPI_MOCK"), false),
};

export function withBase(path: string) {
  return `${config.pokeApiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      ...init.headers,
    },
  });
}

export function handleOptions(): Response {
  return new Response(null, {
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-max-age": "86400",
    },
  });
}
