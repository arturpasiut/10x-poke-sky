import {
  type FilterOption,
  type PokemonGenerationValue,
  type PokemonRegionValue,
  type PokemonSortKey,
  type PokemonTypeValue,
  type SortOption,
} from "./types"

export const MAX_SELECTED_TYPES = 3

export type PokemonTypeMeta = FilterOption<PokemonTypeValue> & {
  gradientFrom: string
  gradientTo: string
  badgeClass: string
  textClass: string
}

const pokemonTypeMetaList = [
  {
    value: "normal",
    label: "Normal",
    gradientFrom: "from-neutral-light/40",
    gradientTo: "to-neutral-dark/40",
    badgeClass: "bg-neutral-dark text-white",
    textClass: "text-neutral-light",
  },
  {
    value: "fire",
    label: "Fire",
    gradientFrom: "from-pokemon-fire/90",
    gradientTo: "to-pokemon-fire/70",
    badgeClass: "bg-pokemon-fire text-white",
    textClass: "text-white",
  },
  {
    value: "water",
    label: "Water",
    gradientFrom: "from-pokemon-water/90",
    gradientTo: "to-pokemon-water/70",
    badgeClass: "bg-pokemon-water text-white",
    textClass: "text-white",
  },
  {
    value: "grass",
    label: "Grass",
    gradientFrom: "from-pokemon-grass/90",
    gradientTo: "to-pokemon-grass/70",
    badgeClass: "bg-pokemon-grass text-white",
    textClass: "text-white",
  },
  {
    value: "electric",
    label: "Electric",
    gradientFrom: "from-pokemon-electric/90",
    gradientTo: "to-pokemon-electric/80",
    badgeClass: "bg-pokemon-electric text-neutral-dark",
    textClass: "text-yellow-50",
  },
  {
    value: "ice",
    label: "Ice",
    gradientFrom: "from-pokemon-ice/90",
    gradientTo: "to-pokemon-ice/60",
    badgeClass: "bg-pokemon-ice text-slate-900",
    textClass: "text-slate-100",
  },
  {
    value: "fighting",
    label: "Fighting",
    gradientFrom: "from-pokemon-fighting/90",
    gradientTo: "to-pokemon-fighting/70",
    badgeClass: "bg-pokemon-fighting text-white",
    textClass: "text-white",
  },
  {
    value: "poison",
    label: "Poison",
    gradientFrom: "from-pokemon-poison/90",
    gradientTo: "to-pokemon-poison/70",
    badgeClass: "bg-pokemon-poison text-white",
    textClass: "text-white",
  },
  {
    value: "ground",
    label: "Ground",
    gradientFrom: "from-pokemon-ground/90",
    gradientTo: "to-pokemon-ground/70",
    badgeClass: "bg-pokemon-ground text-white",
    textClass: "text-white",
  },
  {
    value: "flying",
    label: "Flying",
    gradientFrom: "from-pokemon-flying/90",
    gradientTo: "to-pokemon-flying/70",
    badgeClass: "bg-pokemon-flying text-slate-900",
    textClass: "text-white",
  },
  {
    value: "psychic",
    label: "Psychic",
    gradientFrom: "from-pokemon-psychic/90",
    gradientTo: "to-pokemon-psychic/70",
    badgeClass: "bg-pokemon-psychic text-white",
    textClass: "text-white",
  },
  {
    value: "bug",
    label: "Bug",
    gradientFrom: "from-pokemon-bug/90",
    gradientTo: "to-pokemon-bug/70",
    badgeClass: "bg-pokemon-bug text-white",
    textClass: "text-white",
  },
  {
    value: "rock",
    label: "Rock",
    gradientFrom: "from-pokemon-rock/90",
    gradientTo: "to-pokemon-rock/70",
    badgeClass: "bg-pokemon-rock text-white",
    textClass: "text-white",
  },
  {
    value: "ghost",
    label: "Ghost",
    gradientFrom: "from-pokemon-ghost/90",
    gradientTo: "to-pokemon-ghost/70",
    badgeClass: "bg-pokemon-ghost text-white",
    textClass: "text-white",
  },
  {
    value: "dragon",
    label: "Dragon",
    gradientFrom: "from-pokemon-dragon/90",
    gradientTo: "to-pokemon-dragon/70",
    badgeClass: "bg-pokemon-dragon text-white",
    textClass: "text-white",
  },
  {
    value: "dark",
    label: "Dark",
    gradientFrom: "from-pokemon-dark/90",
    gradientTo: "to-pokemon-dark/70",
    badgeClass: "bg-pokemon-dark text-white",
    textClass: "text-white",
  },
  {
    value: "steel",
    label: "Steel",
    gradientFrom: "from-pokemon-steel/90",
    gradientTo: "to-pokemon-steel/70",
    badgeClass: "bg-pokemon-steel text-white",
    textClass: "text-white",
  },
  {
    value: "fairy",
    label: "Fairy",
    gradientFrom: "from-pokemon-fairy/90",
    gradientTo: "to-pokemon-fairy/70",
    badgeClass: "bg-pokemon-fairy text-white",
    textClass: "text-white",
  },
] satisfies readonly PokemonTypeMeta[]

export const POKEMON_TYPE_META = Object.fromEntries(
  pokemonTypeMetaList.map((meta) => [meta.value, meta]),
) as Record<PokemonTypeValue, PokemonTypeMeta>

export const POKEMON_TYPE_OPTIONS: FilterOption<PokemonTypeValue>[] = pokemonTypeMetaList.map(
  ({ value, label }) => ({ value, label }),
)

const generationOptions: FilterOption<PokemonGenerationValue>[] = [
  { value: "generation-i", label: "Generacja I" },
  { value: "generation-ii", label: "Generacja II" },
  { value: "generation-iii", label: "Generacja III" },
  { value: "generation-iv", label: "Generacja IV" },
  { value: "generation-v", label: "Generacja V" },
  { value: "generation-vi", label: "Generacja VI" },
  { value: "generation-vii", label: "Generacja VII" },
  { value: "generation-viii", label: "Generacja VIII" },
  { value: "generation-ix", label: "Generacja IX" },
]

export const POKEMON_GENERATION_OPTIONS = generationOptions

const regionOptions: FilterOption<PokemonRegionValue>[] = [
  { value: "kanto", label: "Kanto" },
  { value: "johto", label: "Johto" },
  { value: "hoenn", label: "Hoenn" },
  { value: "sinnoh", label: "Sinnoh" },
  { value: "unova", label: "Unova" },
  { value: "kalos", label: "Kalos" },
  { value: "alola", label: "Alola" },
  { value: "galar", label: "Galar" },
  { value: "paldea", label: "Paldea" },
  { value: "hisui", label: "Hisui" },
]

export const POKEMON_REGION_OPTIONS = regionOptions

export const POKEMON_SORT_OPTIONS: SortOption[] = [
  { value: "pokedex", label: "Numer Pokédexu", description: "Domyślna kolejność 001 → 999" },
  { value: "name", label: "Nazwa", description: "Sortuj alfabetycznie" },
  { value: "cachedAt", label: "Ostatnio aktualizowane", description: "Najnowsze wpisy na początku" },
]

const validTypeValues = new Set<PokemonTypeValue>(pokemonTypeMetaList.map((option) => option.value))
const validGenerationValues = new Set<PokemonGenerationValue>(generationOptions.map((option) => option.value))
const validRegionValues = new Set<PokemonRegionValue>(regionOptions.map((option) => option.value))
const validSortKeys = new Set<PokemonSortKey>(POKEMON_SORT_OPTIONS.map((option) => option.value))

export function isValidPokemonType(value: string): value is PokemonTypeValue {
  return validTypeValues.has(value as PokemonTypeValue)
}

export function isValidGeneration(value: string): value is PokemonGenerationValue {
  return validGenerationValues.has(value as PokemonGenerationValue)
}

export function isValidRegion(value: string): value is PokemonRegionValue {
  return validRegionValues.has(value as PokemonRegionValue)
}

export function isValidSortKey(value: string): value is PokemonSortKey {
  return validSortKeys.has(value as PokemonSortKey)
}

export function sanitizeSelectedTypes(values: readonly string[]): PokemonTypeValue[] {
  const deduped: PokemonTypeValue[] = []

  for (const value of values) {
    if (!isValidPokemonType(value)) {
      continue
    }

    if (deduped.includes(value)) {
      continue
    }

    deduped.push(value)

    if (deduped.length === MAX_SELECTED_TYPES) {
      break
    }
  }

  return deduped
}

export function getPokemonTypeMeta(value: PokemonTypeValue): PokemonTypeMeta {
  return POKEMON_TYPE_META[value]
}

export function getTypeGradientClasses(types: readonly PokemonTypeValue[]): string {
  const [primaryType] = types
  const meta = primaryType ? getPokemonTypeMeta(primaryType) : POKEMON_TYPE_META.normal
  return `bg-gradient-to-br ${meta.gradientFrom} ${meta.gradientTo}`
}

export function getTypeBadgeClass(value: PokemonTypeValue): string {
  return getPokemonTypeMeta(value).badgeClass
}

export function getTypeTextClass(value: PokemonTypeValue): string {
  return getPokemonTypeMeta(value).textClass
}

export function getTypeLabel(value: PokemonTypeValue): string {
  return getPokemonTypeMeta(value).label
}

export function getGenerationLabel(value: PokemonGenerationValue): string {
  const option = generationOptions.find((item) => item.value === value)
  return option?.label ?? value
}

export function getRegionLabel(value: PokemonRegionValue): string {
  const option = regionOptions.find((item) => item.value === value)
  return option?.label ?? value
}
