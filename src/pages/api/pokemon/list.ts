import type { APIRoute } from "astro";

import { runtimeConfig } from "@/lib/env";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") ?? "20";
  const offset = url.searchParams.get("offset") ?? "0";
  const search = url.searchParams.get("search") ?? "";
  const types = url.searchParams.getAll("type");
  const generation = url.searchParams.get("generation");
  const region = url.searchParams.get("region");

  const targetUrl = new URL("/functions/v1/pokemon-list", runtimeConfig.supabaseUrl);
  targetUrl.searchParams.set("limit", limit);
  targetUrl.searchParams.set("offset", offset);
  if (search) {
    targetUrl.searchParams.set("search", search);
  }
  types.forEach((type) => targetUrl.searchParams.append("type", type));
  if (generation) {
    targetUrl.searchParams.set("generation", generation);
  }
  if (region) {
    targetUrl.searchParams.set("region", region);
  }

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        apikey: runtimeConfig.supabaseKey,
        Authorization: `Bearer ${runtimeConfig.supabaseKey}`,
        "Content-Type": "application/json",
      },
    });

    const payload = await response.text();

    return new Response(payload, {
      status: response.status,
      headers: {
        "content-type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("pokemon-list api error", error);
    return new Response(JSON.stringify({ error: "Unable to reach Supabase function." }), {
      status: 502,
      headers: {
        "content-type": "application/json",
      },
    });
  }
};

export const prerender = false;
