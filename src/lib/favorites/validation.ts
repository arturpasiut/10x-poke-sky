import { z } from "zod";

import type { FavoritesQueryOptions } from "./service";

const PAGE_MIN = 1;
const PAGE_SIZE_MIN = 1;
const PAGE_SIZE_MAX = 50;
const POKEMON_ID_MIN = 1;
const POKEMON_ID_MAX = 1025;

export const FavoritesQuerySchema = z.object({
  page: z
    .coerce.number({
      invalid_type_error: "Parametr page musi być liczbą.",
    })
    .int("Parametr page musi być liczbą całkowitą.")
    .min(PAGE_MIN, `Parametr page musi być większy lub równy ${PAGE_MIN}.`)
    .default(PAGE_MIN),
  pageSize: z
    .coerce.number({
      invalid_type_error: "Parametr pageSize musi być liczbą.",
    })
    .int("Parametr pageSize musi być liczbą całkowitą.")
    .min(PAGE_SIZE_MIN, `Parametr pageSize musi być większy lub równy ${PAGE_SIZE_MIN}.`)
    .max(PAGE_SIZE_MAX, `Parametr pageSize nie może przekraczać ${PAGE_SIZE_MAX}.`)
    .default(20),
  sort: z
    .enum(["createdAt", "name"], {
      errorMap: () => ({
        message: "Parametr sort może przyjmować wartości createdAt lub name.",
      }),
    })
    .default("createdAt"),
  order: z
    .enum(["asc", "desc"], {
      errorMap: () => ({
        message: "Parametr order może przyjmować wartości asc lub desc.",
      }),
    })
    .default("desc"),
});

export type FavoritesQueryInput = z.infer<typeof FavoritesQuerySchema>;

export const AddFavoriteSchema = z.object({
  pokemonId: z
    .coerce.number({
      invalid_type_error: "Pole pokemonId musi być liczbą.",
      required_error: "Pole pokemonId jest wymagane.",
    })
    .int("Pole pokemonId musi być liczbą całkowitą.")
    .min(POKEMON_ID_MIN, `Identyfikator Pokémona musi być większy lub równy ${POKEMON_ID_MIN}.`)
    .max(POKEMON_ID_MAX, `Identyfikator Pokémona nie może przekraczać ${POKEMON_ID_MAX}.`),
});

export type AddFavoriteInput = z.infer<typeof AddFavoriteSchema>;

export const PokemonIdParamSchema = z
  .coerce.number({
    invalid_type_error: "Parametr pokemonId musi być liczbą.",
  })
  .int("Parametr pokemonId musi być liczbą całkowitą.")
  .min(POKEMON_ID_MIN, `Parametr pokemonId musi być większy lub równy ${POKEMON_ID_MIN}.`)
  .max(POKEMON_ID_MAX, `Parametr pokemonId nie może przekraczać ${POKEMON_ID_MAX}.`);

export type PokemonIdParam = z.infer<typeof PokemonIdParamSchema>;

export const getDefaultFavoritesQuery = (): FavoritesQueryOptions => ({
  page: PAGE_MIN,
  pageSize: 20,
  sort: "createdAt",
  order: "desc",
});
