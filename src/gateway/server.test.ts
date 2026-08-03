import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { handleSearch } from "../lambda/search/handler.js";

/**
 * Lightweight gateway integration: same routing shape as server.ts,
 * without loading the full 467k dictionary.
 */
function createTestGateway(dictionary: Record<string, string>) {
  const app = express();

  app.get("/search", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const limit =
      typeof req.query.limit === "string" ? req.query.limit : undefined;
    const result = handleSearch(
      { queryStringParameters: { q, limit } },
      dictionary,
    );
    res.status(result.statusCode).set(result.headers).send(result.body);
  });

  return app;
}

describe("gateway /search", () => {
  const dictionary = {
    tree: "a woody plant",
    trie: "a prefix tree",
  };

  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createTestGateway(dictionary);
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to bind test server");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("forwards query params to the lambda handler", async () => {
    const response = await fetch(`${baseUrl}/search?q=tr`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([
      { word: "tree", definition: "a woody plant" },
      { word: "trie", definition: "a prefix tree" },
    ]);
  });

  it("returns 400 when q is absent", async () => {
    const response = await fetch(`${baseUrl}/search`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
