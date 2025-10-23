import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  pokeApiEndpoints: {
    moves: "https://example.com/move",
  },
}));

import { buildMoveListFromDataset } from "../pokeapi";
import { createDefaultMoveQueryState } from "../query";
import type { MoveSummaryDto } from "@/types";

const buildMove = (overrides: Partial<MoveSummaryDto> = {}): MoveSummaryDto => ({
  moveId: overrides.moveId ?? 1,
  name: overrides.name ?? "test-move",
  type: overrides.type ?? "normal",
  power: overrides.power ?? 40,
  accuracy: overrides.accuracy ?? 100,
  pp: overrides.pp ?? 35,
  generation: overrides.generation ?? "generation-i",
  cachedAt: overrides.cachedAt ?? new Date().toISOString(),
  damageClass: overrides.damageClass ?? "physical",
});

describe("buildMoveListFromDataset", () => {
  it("filtruje ruchy po damageClass", () => {
    const dataset: MoveSummaryDto[] = [
      buildMove({ moveId: 1, name: "tackle", damageClass: "physical" }),
      buildMove({ moveId: 2, name: "calm-mind", damageClass: "status" }),
      buildMove({ moveId: 3, name: "thunderbolt", damageClass: "special" }),
    ];

    const state = createDefaultMoveQueryState({ damageClasses: ["status"] });
    const result = buildMoveListFromDataset(dataset, state);

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe("calm-mind");
  });

  it("zwraca wszystkie ruchy gdy brak filtra damageClass", () => {
    const dataset: MoveSummaryDto[] = [
      buildMove({ moveId: 1, name: "tackle", damageClass: "physical" }),
      buildMove({ moveId: 2, name: "thunderbolt", damageClass: "special" }),
    ];

    const state = createDefaultMoveQueryState();
    const result = buildMoveListFromDataset(dataset, state);

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.name)).toEqual(["tackle", "thunderbolt"]);
  });
});
