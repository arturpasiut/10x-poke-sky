import { toPokemonSummaryViewModel } from "@/lib/pokemon/transformers";
import type { PokemonSummaryDto, PokemonSummaryViewModel } from "@/lib/pokemon/types";
import type { FavoriteListItemDto, FavoritesListResponseDto } from "@/types";

export type FavoritePokemonViewModel = PokemonSummaryViewModel & {
  addedAt: string;
};

export const toFavoritePokemonSummaryDto = (item: FavoriteListItemDto): PokemonSummaryDto => ({
  pokemonId: item.pokemonId,
  name: item.pokemon.name,
  types: Array.isArray(item.pokemon.types) ? item.pokemon.types : [],
  generation: null,
  region: null,
  spriteUrl: item.pokemon.spriteUrl ?? null,
});

export const toFavoritePokemonViewModel = (item: FavoriteListItemDto): FavoritePokemonViewModel => ({
  ...toPokemonSummaryViewModel(toFavoritePokemonSummaryDto(item)),
  addedAt: item.addedAt,
});

export const mapFavoritesList = (dto: FavoritesListResponseDto): FavoritePokemonViewModel[] =>
  dto.items.map(toFavoritePokemonViewModel);
