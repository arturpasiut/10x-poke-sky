import { Button } from "@/components/ui/button";

const TYPE_OPTIONS = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

const GENERATION_OPTIONS = [
  { value: "", label: "Wszystkie" },
  { value: "generation-i", label: "Generacja I" },
  { value: "generation-ii", label: "Generacja II" },
  { value: "generation-iii", label: "Generacja III" },
  { value: "generation-iv", label: "Generacja IV" },
  { value: "generation-v", label: "Generacja V" },
  { value: "generation-vi", label: "Generacja VI" },
  { value: "generation-vii", label: "Generacja VII" },
  { value: "generation-viii", label: "Generacja VIII" },
  { value: "generation-ix", label: "Generacja IX" },
];

const REGION_OPTIONS = [
  { value: "", label: "Wszystkie" },
  { value: "kanto", label: "Kanto" },
  { value: "johto", label: "Johto" },
  { value: "hoenn", label: "Hoenn" },
  { value: "sinnoh", label: "Sinnoh" },
  { value: "unova", label: "Unova" },
  { value: "kalos", label: "Kalos" },
  { value: "alola", label: "Alola" },
  { value: "galar", label: "Galar" },
  { value: "paldea", label: "Paldea" },
];

interface PokemonFiltersProps {
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  selectedGeneration: string;
  onSelectGeneration: (generation: string) => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  onReset: () => void;
}

export function PokemonFilters({
  selectedTypes,
  onToggleType,
  selectedGeneration,
  onSelectGeneration,
  selectedRegion,
  onSelectRegion,
  onReset,
}: PokemonFiltersProps) {
  return (
    <div className="space-y-6 rounded-2xl border border-border/40 bg-surface/70 p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Filtry</p>
          <h3 className="font-semibold text-foreground">Dopasuj wyniki</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Resetuj
        </Button>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Typ</span>
          <span className="text-xs text-muted-foreground">{selectedTypes.length} / 3</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((type) => {
            const active = selectedTypes.includes(type);
            return (
              <Button
                key={type}
                type="button"
                variant={active ? "default" : "outline"}
                onClick={() => onToggleType(type)}
                disabled={!active && selectedTypes.length >= 3}
                className="rounded-full capitalize"
              >
                {type}
              </Button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <span className="text-sm font-semibold text-foreground">Generacja</span>
        <div className="grid grid-cols-2 gap-2">
          {GENERATION_OPTIONS.map((option) => {
            const active = selectedGeneration === option.value;
            return (
              <Button
                key={option.value || "all"}
                type="button"
                variant={active ? "default" : "outline"}
                onClick={() => onSelectGeneration(option.value)}
                className="rounded-full text-sm"
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <span className="text-sm font-semibold text-foreground">Region</span>
        <div className="grid grid-cols-2 gap-2">
          {REGION_OPTIONS.map((option) => {
            const active = selectedRegion === option.value;
            return (
              <Button
                key={option.value || "all"}
                type="button"
                variant={active ? "default" : "outline"}
                onClick={() => onSelectRegion(option.value)}
                className="rounded-full text-sm"
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
