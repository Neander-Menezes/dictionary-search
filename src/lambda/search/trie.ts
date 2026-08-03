import type { DictionaryEntry } from "../../shared/types.js";

type TrieNode = {
  children: Map<string, TrieNode>;
  definition: string | null;
  isWord: boolean;
};

const createNode = (): TrieNode => ({
  children: new Map(),
  definition: null,
  isWord: false,
});

export class Trie {
  private readonly root: TrieNode = createNode();

  static fromEntries(entries: Iterable<readonly [string, string]>): Trie {
    const trie = new Trie();
    for (const [word, definition] of entries) {
      trie.insert(word, definition);
    }
    trie.freezeOrder();
    return trie;
  }

  insert(rawWord: string, definition: string): void {
    const word = rawWord.trim().toLowerCase();
    if (!word) {
      return;
    }

    let node = this.root;
    for (const char of word) {
      let child = node.children.get(char);
      if (!child) {
        child = createNode();
        node.children.set(char, child);
      }
      node = child;
    }

    node.isWord = true;
    node.definition = definition;
  }

  /** Call once after bulk insert so collect() can walk children without sorting. */
  freezeOrder(): void {
    this.sortChildren(this.root);
  }

  private sortChildren(node: TrieNode): void {
    const ordered = [...node.children.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    node.children = new Map(ordered);
    for (const child of node.children.values()) {
      this.sortChildren(child);
    }
  }

  prefixSearch(rawPrefix: string, limit: number): DictionaryEntry[] {
    const prefix = rawPrefix.trim().toLowerCase();
    if (!prefix || limit <= 0) {
      return [];
    }

    let node: TrieNode | undefined = this.root;
    for (const char of prefix) {
      node = node.children.get(char);
      if (!node) {
        return [];
      }
    }

    const results: DictionaryEntry[] = [];
    this.collect(node, prefix, results, limit);
    return results;
  }

  private collect(
    node: TrieNode,
    prefix: string,
    results: DictionaryEntry[],
    limit: number,
  ): void {
    if (results.length >= limit) {
      return;
    }

    if (node.isWord && node.definition !== null) {
      results.push({ word: prefix, definition: node.definition });
    }

    for (const [char, child] of node.children) {
      if (results.length >= limit) {
        return;
      }
      this.collect(child, prefix + char, results, limit);
    }
  }
}
