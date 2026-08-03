import type { LambdaEvent, LambdaResult } from "../../shared/types.js";
import { Trie } from "./trie.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

export type DictionaryMap = Record<string, string>;

let cachedTrie: Trie | null = null;
let cachedSource: DictionaryMap | null = null;

export function getOrBuildTrie(dictionary: DictionaryMap): Trie {
  if (cachedTrie && cachedSource === dictionary) {
    return cachedTrie;
  }

  cachedTrie = Trie.fromEntries(Object.entries(dictionary));
  cachedSource = dictionary;
  return cachedTrie;
}

export function resetTrieCache(): void {
  cachedTrie = null;
  cachedSource = null;
}

function parseLimit(raw: string | undefined): number {
  if (raw === undefined || raw === "") {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

function jsonResult(statusCode: number, payload: unknown): LambdaResult {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  };
}

/**
 * Lambda-style search handler. Gateway invokes this with API Gateway–shaped events.
 * Dictionary + trie are treated as cold-start state (built once per dictionary instance).
 */
export function handleSearch(
  event: LambdaEvent,
  dictionary: DictionaryMap,
): LambdaResult {
  const q = event.queryStringParameters?.q?.trim() ?? "";
  if (!q) {
    return jsonResult(400, {
      success: false,
      data: null,
      error: 'Query parameter "q" is required',
    });
  }

  const limit = parseLimit(event.queryStringParameters?.limit);
  const trie = getOrBuildTrie(dictionary);
  const data = trie.prefixSearch(q, limit);

  return jsonResult(200, {
    success: true,
    data,
    error: null,
  });
}
