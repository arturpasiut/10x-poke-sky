import * as React from "react";
import { Sparkles, Zap, Flame, Droplets, ShieldHalf, Search, Info } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip, type ChipTone } from "@/components/ui/chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const sampleTypes: { label: string; tone: ChipTone }[] = [
  { label: "Normal", tone: "normal" },
  { label: "Fire", tone: "fire" },
  { label: "Water", tone: "water" },
  { label: "Electric", tone: "electric" },
  { label: "Grass", tone: "grass" },
  { label: "Ice", tone: "ice" },
  { label: "Fighting", tone: "fighting" },
  { label: "Poison", tone: "poison" },
];

const activeTypes = new Set(["Fire", "Electric", "Grass"]);

const samplePokemon = [
  {
    name: "Bulbasaur",
    number: "#001",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
    types: ["grass", "poison"],
    accent: "from-green-600/20 via-emerald-500/10 to-emerald-500/0",
  },
  {
    name: "Charmander",
    number: "#004",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png",
    types: ["fire"],
    accent: "from-orange-500/20 via-orange-400/10 to-orange-400/0",
  },
  {
    name: "Squirtle",
    number: "#007",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png",
    types: ["water"],
    accent: "from-blue-500/20 via-sky-400/10 to-sky-400/0",
  },
] as const;

const ShowcaseCard = ({
  title,
  description,
  icon,
  accent,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
}) => (
  <Card className={cn("overflow-hidden", accent ? `bg-gradient-to-br ${accent}` : "")}>
    <CardHeader className="relative pb-6">
      <div className="absolute left-6 top-6 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
        {icon}
      </div>
      <CardTitle className="pl-16">{title}</CardTitle>
      <CardDescription className="pl-16">{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export const UiShowcase: React.FC = () => (
  <div className="space-y-10 pb-20">
    <section className="grid gap-6 lg:grid-cols-[1.4fr_minmax(0,1fr)]">
      <Card className="relative isolate overflow-hidden border border-border/40 bg-surface/90">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#5798ff33,transparent_60%)] dark:bg-[radial-gradient(circle_at_top,#4c5fff26,transparent_60%)]" />
        <CardHeader className="flex flex-col gap-4 pb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-primary" />
            <Badge variant="surface">Preview</Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">Jakiego Pokémona szukasz?</CardTitle>
          <CardDescription>
            Szybki przegląd nowych komponentów UI. Zmieniaj zakładki, filtry i zobacz detale w modalu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-full bg-muted/70 px-6 py-4 ring-1 ring-border/60 backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3">
              <Search className="size-5 text-muted-foreground" />
              <input
                className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/70"
                placeholder="Nazwa, numer Pokédexu, typ…"
                disabled
              />
            </div>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Podgląd
            </Button>
          </div>
          <Tabs defaultValue="pokedex">
            <TabsList className="grid w-full grid-cols-2 gap-2 sm:flex sm:gap-1">
              <TabsTrigger value="pokedex" className="group data-[state=active]:text-primary">
                <Search className="mr-2 size-4 opacity-70 group-data-[state=active]:opacity-100" />
                Pokédex
              </TabsTrigger>
              <TabsTrigger value="moves" className="group">
                <Flame className="mr-2 size-4 opacity-70 group-data-[state=active]:opacity-100" />
                Moves
              </TabsTrigger>
              <TabsTrigger value="evolutions" className="group">
                <Sparkles className="mr-2 size-4 opacity-70 group-data-[state=active]:opacity-100" />
                Evolutions
              </TabsTrigger>
              <TabsTrigger value="locations" className="group">
                <Droplets className="mr-2 size-4 opacity-70 group-data-[state=active]:opacity-100" />
                Locations
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pokedex">
              <div className="grid gap-4 md:grid-cols-3">
                {samplePokemon.map((pokemon) => (
                  <Card
                    key={pokemon.name}
                    className="group relative overflow-hidden border border-border/40 bg-gradient-to-br from-background via-surface to-surface/80 transition-transform hover:-translate-y-1 hover:shadow-floating"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5" />
                    <CardHeader className="relative pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="ghost" className="text-xs tracking-widest text-muted-foreground/80">
                          {pokemon.number}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full text-muted-foreground hover:text-foreground"
                            >
                              <Info className="size-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{pokemon.name}</DialogTitle>
                              <DialogDescription>
                                Ten modal wykorzystuje komponenty dialogu shadcn/ui z dostosowanym stylem projektu.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                              <img
                                src={pokemon.sprite}
                                alt={pokemon.name}
                                className="mx-auto size-28 shrink-0 drop-shadow-lg"
                              />
                              <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <ShieldHalf className="size-4 text-primary" />
                                  <span>Statystyki bazowe</span>
                                </div>
                                <div className="space-y-1 text-muted-foreground">
                                  <p>HP · 45</p>
                                  <p>Attack · 49</p>
                                  <p>Speed · 45</p>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="secondary">Dodaj do ulubionych</Button>
                              <Button>Zobacz szczegóły</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <CardTitle className="text-xl">{pokemon.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="relative flex flex-col items-center gap-4">
                      <div className="relative flex size-32 items-center justify-center rounded-3xl bg-gradient-to-br from-white/70 to-white/20 p-4 shadow-inner shadow-black/10 dark:from-white/10 dark:via-white/5 dark:to-transparent">
                        <img
                          src={pokemon.sprite}
                          alt={pokemon.name}
                          className="pointer-events-none max-h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
                        />
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {pokemon.types.map((type) => (
                          <Badge key={type} tone={type as BadgeTone} variant="surface">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="moves">
              <Card>
                <CardHeader>
                  <CardTitle>Moves w przygotowaniu</CardTitle>
                  <CardDescription>Ten stan prezentuje kartę z domyślnym stylem i wariantami badge.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="primary">Physical</Badge>
                  <Badge variant="secondary">Special</Badge>
                  <Badge variant="tertiary">Status</Badge>
                  <Badge variant="outline">Accuracy 100%</Badge>
                  <Badge variant="surface">Power 80</Badge>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm">
                    Zobacz wszystkie ruchy
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="evolutions">
              <ShowcaseCard
                title="Ścieżki ewolucji"
                description="Chained layout z gradientem tła."
                icon={<Sparkles className="size-5" />}
                accent="from-purple-500/15 via-purple-500/5 to-transparent"
              >
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Badge variant="surface">Bulbasaur</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="surface">Ivysaur</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="surface">Venusaur</Badge>
                </div>
              </ShowcaseCard>
            </TabsContent>
            <TabsContent value="locations">
              <ShowcaseCard
                title="Lokalizacje"
                description="Przykład karty z ikoną i gradientem."
                icon={<Droplets className="size-5" />}
                accent="from-blue-500/15 via-blue-500/5 to-transparent"
              >
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• Kanto · Route 24 · Grass (Morning)</p>
                  <p>• Paldea · South Province (Area Four) · Water</p>
                  <p>• Hisui · Obsidian Fieldlands · Rain</p>
                </div>
              </ShowcaseCard>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="h-full border border-border/40 bg-surface/90">
        <CardHeader>
          <CardTitle>Dopasuj wyniki (0/3)</CardTitle>
          <CardDescription>Przykładowy panel filtrów z chipami i przyciskami.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">Filtry</Badge>
            <Button variant="ghost" size="sm">
              Resetuj
            </Button>
          </div>
          <div className="grid gap-3">
            {sampleTypes.map((type) => (
              <Chip key={type.label} tone={type.tone} active={activeTypes.has(type.label)} className="justify-between">
                {type.label}
                {activeTypes.has(type.label) ? <Zap className="size-4 text-primary-foreground" /> : null}
              </Chip>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-border/40 pt-4">
          <div className="flex w-full items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
            <span>Wyniki</span>
            <span>124 Pokémona</span>
          </div>
          <Button className="w-full">Zastosuj filtry</Button>
        </CardFooter>
      </Card>
    </section>

    <section className="grid gap-4 md:grid-cols-2">
      <ShowcaseCard
        title="Statystyki ulubionych"
        description="Akcentowana karta z linearnym gradientem i ikoną."
        icon={<ShieldHalf className="size-5" />}
        accent="from-amber-400/20 via-orange-400/10 to-transparent"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-muted/70 px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ulubione</p>
            <p className="mt-2 text-2xl font-semibold">18</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 6 Pokémonów typu Grass</p>
            <p>• 4 Pokémony z regionu Kanto</p>
            <p>• 3 ostatnio dodane w tym tygodniu</p>
          </div>
        </div>
      </ShowcaseCard>

      <ShowcaseCard
        title="Szybkie akcje"
        description="Sekcja pokazuje przyciski i badge w różnych wariantach."
        icon={<Flame className="size-5" />}
        accent="from-rose-500/20 via-rose-500/10 to-transparent"
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Pobierz listę</Button>
          <Button size="sm" variant="secondary">
            Udostępnij link
          </Button>
          <Button size="sm" variant="outline">
            Tryb porównania
          </Button>
          <Badge variant="ghost">Auto-sync włączony</Badge>
        </div>
      </ShowcaseCard>
    </section>
  </div>
);

export default UiShowcase;
