import type { APIRoute } from "astro";
import { z } from "zod";

import { fetchPokemonSummary } from "../pokemon";

const querySchema = z.object({
  ids: z
    .string()
    .optional()
    .transform(
      (value) =>
        value
          ?.split(",")
          .map((entry) => entry.trim())
          .filter(Boolean) ?? []
    ),
  id: z
    .string()
    .optional()
    .transform((value) => (value ? [value.trim()] : [])),
});

const parseIds = (params: URLSearchParams): number[] => {
  const parsed = querySchema.safeParse({
    ids: params.get("ids"),
    id: params.get("id"),
  });

  if (!parsed.success) {
    return [];
  }

  const candidates = [...parsed.data.ids, ...parsed.data.id];

  return candidates
    .map((value) => {
      const numeric = Number.parseInt(value, 10);
      return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
    })
    .filter((value): value is number => value !== null);
};

const json = (body: unknown, init: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

export const GET: APIRoute = async ({ url }) => {
  const ids = parseIds(url.searchParams);

  if (ids.length === 0) {
    return json(
      {
        message: "Parametr `id` lub `ids` jest wymagany.",
      },
      { status: 400 }
    );
  }

  try {
    const summaries = await Promise.all(ids.map((id) => fetchPokemonSummary(id)));
    const items = summaries.filter((summary): summary is NonNullable<typeof summary> => Boolean(summary));

    if (items.length === 0) {
      return json(
        {
          message: "Nie znaleziono Pokémonów dla podanych identyfikatorów.",
        },
        { status: 404 }
      );
    }

    return json(
      {
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    return json(
      {
        message: "Nie udało się pobrać szczegółów Pokémonów.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
