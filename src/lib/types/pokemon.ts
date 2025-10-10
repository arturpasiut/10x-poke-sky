/**
 * Typed interfaces for common PokeAPI endpoints leveraged across the app.
 * Source: https://pokeapi.co/docs/v2
 *
 * These types intentionally model only the fields we plan to use in the MVP
 * (list, detail, moves, species, evolution). Additional attributes can be
 * appended as new product requirements emerge.
 */

export interface PaginatedResponse<TItem> {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
}

export interface APIResource {
  url: string;
}

export interface NamedAPIResource<TName extends string = string> extends APIResource {
  name: TName;
}

export type PokemonListResponse = PaginatedResponse<NamedAPIResource>;

export interface PokemonAbility {
  ability: NamedAPIResource;
  is_hidden: boolean;
  slot: number;
}

export interface VersionGameIndex {
  game_index: number;
  version: NamedAPIResource;
}

export interface PokemonHeldItem {
  item: NamedAPIResource;
  version_details: {
    rarity: number;
    version: NamedAPIResource;
  }[];
}

export interface PokemonMoveVersion {
  move_learn_method: NamedAPIResource;
  version_group: NamedAPIResource;
  level_learned_at: number;
}

export interface PokemonMove {
  move: NamedAPIResource;
  version_group_details: PokemonMoveVersion[];
}

export interface PokemonSpriteSet {
  back_default: string | null;
  back_female: string | null;
  back_shiny: string | null;
  back_shiny_female: string | null;
  front_default: string | null;
  front_female: string | null;
  front_shiny: string | null;
  front_shiny_female: string | null;
  other?: {
    "official-artwork"?: {
      front_default: string | null;
      front_shiny?: string | null;
    };
    dream_world?: {
      front_default: string | null;
      front_female: string | null;
    };
  };
  home?: {
    front_default: string | null;
    front_shiny: string | null;
    front_female: string | null;
    front_shiny_female: string | null;
  };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
}

export interface PokemonType {
  slot: number;
  type: NamedAPIResource;
}

export interface PokemonPastType {
  generation: NamedAPIResource;
  types: PokemonType[];
}

export interface Pokemon {
  id: number;
  name: string;
  base_experience: number | null;
  height: number;
  weight: number;
  order: number;
  abilities: PokemonAbility[];
  forms: NamedAPIResource[];
  game_indices: VersionGameIndex[];
  held_items: PokemonHeldItem[];
  location_area_encounters: string;
  moves: PokemonMove[];
  sprites: PokemonSpriteSet;
  species: NamedAPIResource;
  stats: PokemonStat[];
  types: PokemonType[];
  past_types?: PokemonPastType[];
  cries?: {
    latest: string | null;
    legacy: string | null;
  };
}

export interface PokemonSpeciesVariety {
  is_default: boolean;
  pokemon: NamedAPIResource;
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: NamedAPIResource;
  version?: NamedAPIResource;
}

export interface NameEntry {
  language: NamedAPIResource;
  name: string;
}

export interface GenusEntry {
  genus: string;
  language: NamedAPIResource;
}

export interface EvolutionDetail {
  trigger: NamedAPIResource;
  gender: number | null;
  held_item: NamedAPIResource | null;
  item: NamedAPIResource | null;
  known_move: NamedAPIResource | null;
  known_move_type: NamedAPIResource | null;
  location: NamedAPIResource | null;
  min_affection: number | null;
  min_beauty: number | null;
  min_happiness: number | null;
  min_level: number | null;
  needs_overworld_rain: boolean;
  party_species: NamedAPIResource | null;
  party_type: NamedAPIResource | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: NamedAPIResource | null;
  turn_upside_down: boolean;
}

export interface ChainLink {
  is_baby: boolean;
  species: NamedAPIResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
}

export interface EvolutionChain {
  id: number;
  baby_trigger_item: NamedAPIResource | null;
  chain: ChainLink;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  growth_rate: NamedAPIResource;
  pokedex_numbers: {
    entry_number: number;
    pokedex: NamedAPIResource;
  }[];
  egg_groups: NamedAPIResource[];
  color: NamedAPIResource;
  shape: NamedAPIResource;
  evolves_from_species: NamedAPIResource | null;
  evolution_chain: APIResource | null;
  habitat: NamedAPIResource | null;
  generation: NamedAPIResource;
  names: NameEntry[];
  flavor_text_entries: FlavorTextEntry[];
  genera: GenusEntry[];
  varieties: PokemonSpeciesVariety[];
}

export interface MoveMetaData {
  ailment: NamedAPIResource;
  category: NamedAPIResource;
  min_hits: number | null;
  max_hits: number | null;
  min_turns: number | null;
  max_turns: number | null;
  drain: number;
  healing: number;
  crit_rate: number;
  ailment_chance: number;
  flinch_chance: number;
  stat_chance: number;
}

export interface MoveStatChange {
  change: number;
  stat: NamedAPIResource;
}

export interface Move {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number | null;
  priority: number;
  type: NamedAPIResource;
  damage_class: NamedAPIResource;
  target: NamedAPIResource;
  contest_type: NamedAPIResource | null;
  meta: MoveMetaData | null;
  stat_changes: MoveStatChange[];
  effect_chance: number | null;
  effect_entries: {
    effect: string;
    short_effect: string;
    language: NamedAPIResource;
  }[];
  flavor_text_entries: FlavorTextEntry[];
  learned_by_pokemon: NamedAPIResource[];
}
