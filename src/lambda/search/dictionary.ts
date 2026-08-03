import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DictionaryMap } from "./handler.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultDictionaryPath = path.resolve(
  moduleDir,
  "../../../data/dictionary.json",
);

const cache = new Map<string, DictionaryMap>();

export async function loadDictionary(
  dictionaryPath: string = defaultDictionaryPath,
): Promise<DictionaryMap> {
  const resolved = path.resolve(dictionaryPath);
  const cached = cache.get(resolved);
  if (cached) {
    return cached;
  }

  const raw = await readFile(resolved, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Dictionary at ${resolved} must be a JSON object`);
  }

  const loaded = parsed as DictionaryMap;
  cache.set(resolved, loaded);
  return loaded;
}

export function resetDictionaryCache(): void {
  cache.clear();
}
