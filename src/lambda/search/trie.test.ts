import { describe, expect, it } from "vitest";
import { Trie } from "./trie.js";

describe("Trie", () => {
  it("returns empty results for an empty prefix", () => {
    const trie = Trie.fromEntries([
      ["tree", "a woody plant"],
      ["trie", "a prefix tree"],
    ]);

    expect(trie.prefixSearch("", 10)).toEqual([]);
  });

  it("returns words that share an exact prefix", () => {
    const trie = Trie.fromEntries([
      ["tree", "a woody plant"],
      ["trie", "a prefix tree"],
      ["trip", "a journey"],
      ["cat", "a small animal"],
    ]);

    expect(trie.prefixSearch("tr", 10)).toEqual([
      { word: "tree", definition: "a woody plant" },
      { word: "trie", definition: "a prefix tree" },
      { word: "trip", definition: "a journey" },
    ]);
  });

  it("respects the result limit", () => {
    const trie = Trie.fromEntries([
      ["tree", "a woody plant"],
      ["trek", "a long journey"],
      ["trie", "a prefix tree"],
      ["trip", "a journey"],
    ]);

    expect(trie.prefixSearch("tr", 2)).toHaveLength(2);
  });

  it("returns an empty list when nothing matches", () => {
    const trie = Trie.fromEntries([["tree", "a woody plant"]]);

    expect(trie.prefixSearch("zzz", 10)).toEqual([]);
  });

  it("is case-insensitive for the query prefix", () => {
    const trie = Trie.fromEntries([["Tree", "a woody plant"]]);

    expect(trie.prefixSearch("TR", 10)).toEqual([
      { word: "tree", definition: "a woody plant" },
    ]);
  });
});
