import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MoveListResponseDto } from "@/types";
import { createDefaultMoveQueryState } from "@/lib/moves/query";

import { useMoveListQuery } from "../useMoveListQuery";

const sampleResponse: MoveListResponseDto = {
  items: [
    {
      moveId: 1,
      name: "tackle",
      type: "normal",
      power: 40,
      accuracy: 100,
      pp: 35,
      generation: "generation-i",
      cachedAt: new Date().toISOString(),
      damageClass: "physical",
    },
  ],
  page: 1,
  pageSize: 24,
  total: 1,
  hasNext: false,
};

describe("useMoveListQuery", () => {
  it("serializuje parametry damageClass i mapuje odpowiedź", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    });

    const queryState = createDefaultMoveQueryState({ damageClasses: ["physical"] });

    const { result } = renderHook(() => useMoveListQuery(queryState, { fetcher }));

    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(fetcher).toHaveBeenCalled();
    const calledUrl = fetcher.mock.calls[0]?.[0];
    expect(typeof calledUrl).toBe("string");
    expect(String(calledUrl)).toContain("damageClass=physical");
    expect(result.current.data?.items[0]?.damageClassLabel).toBe("Fizyczny");
  });
});
