import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDictionary } from "../lambda/search/dictionary.js";
import { handleSearch } from "../lambda/search/handler.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(moduleDir, "../../client");
// 3010 avoids the common Docker/other-dev conflict on 3000.
const PORT = Number.parseInt(process.env.PORT ?? "3010", 10);
const HOST = process.env.HOST ?? "127.0.0.1";

async function main(): Promise<void> {
  console.log("Loading dictionary (cold start)...");
  const started = Date.now();
  const dictionary = await loadDictionary();
  const wordCount = Object.keys(dictionary).length;

  // Warm the trie once so the first user request is snappy.
  handleSearch({ queryStringParameters: { q: "a", limit: "1" } }, dictionary);
  console.log(
    `Ready: ${wordCount.toLocaleString()} words in ${Date.now() - started}ms`,
  );

  const app = express();
  // Client is served from the same origin — no CORS needed for MVP.
  app.use(express.static(clientDir));

  app.get("/search", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const limit =
      typeof req.query.limit === "string" ? req.query.limit : undefined;

    const result = handleSearch({ queryStringParameters: { q, limit } }, dictionary);

    res.status(result.statusCode).set(result.headers).send(result.body);
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, words: wordCount });
  });

  const server = app.listen(PORT, HOST, () => {
    console.log(`Gateway listening on http://${HOST}:${PORT}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Try: PORT=3011 npm run start`,
      );
    } else {
      console.error("Failed to bind gateway:", error);
    }
    process.exit(1);
  });

  const shutdown = (signal: string): void => {
    console.log(`\n${signal} received — shutting down gateway`);
    server.close((closeError) => {
      if (closeError) {
        console.error("Error while closing gateway:", closeError);
        process.exit(1);
      }
      process.exit(0);
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error: unknown) => {
  console.error("Failed to start gateway:", error);
  process.exit(1);
});
