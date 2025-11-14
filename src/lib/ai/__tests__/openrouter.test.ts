import { describe, expect, it } from "vitest";

import { safeParseJson } from "../json-utils";

describe("safeParseJson", () => {
  it("parses plain JSON payloads", () => {
    expect(safeParseJson('{"success":true,"suggestions":[]}')).toEqual({
      success: true,
      suggestions: [],
    });
  });

  it("accepts JSON inside fenced code blocks", () => {
    const payload = [
      "```json",
      "{",
      '  "success": true,',
      '  "suggestions": [{"pokemon_id": 130, "name": "Gyarados"}]',
      "}",
      "```",
    ].join("\n");

    expect(safeParseJson(payload)).toEqual({
      success: true,
      suggestions: [{ pokemon_id: 130, name: "Gyarados" }],
    });
  });

  it("extracts JSON from strings with extra commentary", () => {
    const payload =
      'Here is the answer you asked for: {"success":true,"suggestions":[{"pokemon_id":134}]} Thanks for reading!';

    expect(safeParseJson(payload)).toEqual({
      success: true,
      suggestions: [{ pokemon_id: 134 }],
    });
  });

  it("returns null when no JSON is present", () => {
    expect(safeParseJson("Model could not comply.")).toBeNull();
  });
});
