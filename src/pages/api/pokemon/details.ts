import type { APIRoute } from "astro";

import { runtimeConfig } from "@/lib/env";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const identifier = url.searchParams.get("identifier")?.trim();

  if (!identifier) {
    return new Response(JSON.stringify({ error: "Missing identifier parameter" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const targetUrl = new URL("/functions/v1/pokemon-details", runtimeConfig.supabaseUrl);
  targetUrl.searchParams.set("identifier", identifier);

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
    console.error("pokemon-details api error", error);
    return new Response(JSON.stringify({ error: "Unable to reach Supabase function." }), {
      status: 502,
      headers: {
        "content-type": "application/json",
      },
    });
  }
};

export const prerender = false;
