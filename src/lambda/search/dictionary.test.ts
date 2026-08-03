import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadDictionary, resetDictionaryCache } from "./dictionary.js";

async function writeDict(
  dir: string,
  name: string,
  data: Record<string, string>,
): Promise<string> {
  const filePath = path.join(dir, name);
  await writeFile(filePath, JSON.stringify(data), "utf8");
  return filePath;
}

describe("loadDictionary", () => {
  afterEach(() => {
    resetDictionaryCache();
  });

  it("loads a word→definition JSON object from disk", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "dict-"));
    const filePath = await writeDict(dir, "dictionary.json", {
      tree: "a woody plant",
    });

    const dictionary = await loadDictionary(filePath);

    expect(dictionary).toEqual({ tree: "a woody plant" });
    // Same resolved path returns the cached instance
    expect(await loadDictionary(filePath)).toBe(dictionary);
  });

  it("caches independently per resolved path", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "dict-"));
    const firstPath = await writeDict(dir, "a.json", { alpha: "first" });
    const secondPath = await writeDict(dir, "b.json", { beta: "second" });

    const first = await loadDictionary(firstPath);
    const second = await loadDictionary(secondPath);

    expect(first).toEqual({ alpha: "first" });
    expect(second).toEqual({ beta: "second" });
    expect(first).not.toBe(second);
    expect(await loadDictionary(firstPath)).toBe(first);
    expect(await loadDictionary(secondPath)).toBe(second);
  });

  it("rejects non-object JSON payloads", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "dict-"));
    const filePath = await writeDict(dir, "dictionary.json", {});
    await writeFile(filePath, JSON.stringify(["tree"]), "utf8");

    await expect(loadDictionary(filePath)).rejects.toThrow(/JSON object/);
  });
});
