import { describe, it, expect, beforeEach } from "vitest";

import { createDefaultMoveQueryState } from "@/lib/moves/query";
import { useMoveSearchStore } from "@/stores/useMoveSearchStore";

const resetStore = () => {
  const next = createDefaultMoveQueryState();
  useMoveSearchStore.setState((state) => ({
    ...state,
    ...next,
    isHydrated: false,
    lastAppliedQuery: next,
  }));
};

describe("useMoveSearchStore", () => {
  beforeEach(() => {
    resetStore();
  });

  it("dodaje i usuwa klasy obrażeń", () => {
    const { toggleDamageClass } = useMoveSearchStore.getState();

    toggleDamageClass("physical");
    expect(useMoveSearchStore.getState().damageClasses).toEqual(["physical"]);

    toggleDamageClass("physical");
    expect(useMoveSearchStore.getState().damageClasses).toEqual([]);
  });

  it("setDamageClasses filtruje duplikaty i nieprawidłowe wartości", () => {
    const { setDamageClasses } = useMoveSearchStore.getState();

    // @ts-expect-error – celowo przekazujemy niepoprawny typ by sprawdzić filtrację
    setDamageClasses(["physical", "special", "physical", "mystic"]);

    expect(useMoveSearchStore.getState().damageClasses).toEqual(["physical", "special"]);
  });

  it("resetFilters czyści klasy obrażeń", () => {
    const store = useMoveSearchStore.getState();

    store.setDamageClasses(["status"]);
    expect(useMoveSearchStore.getState().damageClasses).toEqual(["status"]);

    store.resetFilters();
    expect(useMoveSearchStore.getState().damageClasses).toEqual([]);
  });

  it("toQueryString zawiera parametry damageClass", () => {
    const store = useMoveSearchStore.getState();

    store.setDamageClasses(["physical", "special"]);
    const query = store.toQueryString();

    expect(query).toContain("damageClass=physical");
    expect(query).toContain("damageClass=special");
  });
});
