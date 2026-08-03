import { describe, expect, it } from "vitest";
import { handleSearch } from "./handler.js";

describe("handleSearch", () => {
  const dictionary = {
    tree: "a woody plant",
    trie: "a prefix tree",
    trip: "a journey",
  };

  it("returns 400 when q is missing", () => {
    const result = handleSearch({ queryStringParameters: {} }, dictionary);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/q/i);
  });

  it("returns prefix matches for a valid query", () => {
    const result = handleSearch(
      { queryStringParameters: { q: "tr", limit: "10" } },
      dictionary,
    );

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([
      { word: "tree", definition: "a woody plant" },
      { word: "trie", definition: "a prefix tree" },
      { word: "trip", definition: "a journey" },
    ]);
  });

  it("defaults limit when omitted and clamps invalid limits", () => {
    const ok = handleSearch(
      { queryStringParameters: { q: "tr" } },
      dictionary,
    );
    expect(JSON.parse(ok.body).data).toHaveLength(3);

    const clamped = handleSearch(
      { queryStringParameters: { q: "tr", limit: "0" } },
      dictionary,
    );
    expect(JSON.parse(clamped.body).data.length).toBeGreaterThan(0);
  });
});
