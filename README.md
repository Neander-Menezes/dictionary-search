# Dictionary Search

Local cloud simulation of a **dictionary typeahead search** service, built as system-design interview practice.

```
Browser client  →  API Gateway (Express)  →  Lambda (in-memory trie)
```

You type a prefix (`tr`), the UI debounces and polls the gateway, and the lambda walks a pre-built trie over ~**467k** English words to return matching entries with definitions.

## Why this exists

Interview prompt (simplified): design search for a large English dictionary web app — snappy prefix lookup, handle typos later, scale reads eventually.

This repo implements the **MVP slice**:

| In scope now | Deferred |
|---|---|
| Exact **prefix** match | Misspellings / fuzzy / phonetic |
| Word + definition results | Related-word ranking |
| In-memory trie at “cold start” | Multi-region / 10k RPS infra |
| Simple typeahead UI | Auth, subscriptions, CDN |

## Architecture

| Piece | Role in “cloud” | Local stand-in |
|---|---|---|
| **Client** | Browser UI | Static files in `client/` |
| **Gateway** | API Gateway / edge HTTP | Express in `src/gateway/` |
| **Lambda** | Stateless search function | `handleSearch()` in `src/lambda/search/` |
| **Data** | Dictionary warehouse | `data/dictionary.json` loaded once into memory + trie |

Cold start path:

1. Gateway boots and loads the dictionary map from disk.
2. Trie is built once (and warmed with a dummy query).
3. Each `GET /search` is a lambda-style invoke: validate params → `prefixSearch` → JSON envelope.

## Dataset

- Source: [MongoDB/english-words-definitions](https://huggingface.co/datasets/MongoDB/english-words-definitions) (~467k terms)
- Runtime file: `data/dictionary.json` — `{ "word": "first definition", ... }`
- Raw JSONL (`vocab.jsonl`) is **not** committed; regenerate if you need it:

```bash
curl -L -o data/vocab.jsonl \
  "https://huggingface.co/datasets/MongoDB/english-words-definitions/resolve/main/vocab.jsonl"
```

## Quick start

Requires **Node.js 20+**.

```bash
npm install
npm test
npm run build
npm run start
```

Open **http://127.0.0.1:3010**

Default port is **3010** (port 3000 is often taken by Docker). Override on the same line:

```bash
PORT=3011 npm run start
```

Check health:

```bash
npm run status
# or: curl http://127.0.0.1:3010/health
```

## Lifecycle (up / down)

**Up** — one Node process stays running and holds the port. The terminal stays occupied; last line looks like:

```text
Gateway listening on http://127.0.0.1:3010
```

**Down** — stop that process:

- Foreground: `Ctrl+C` (SIGINT) — graceful close
- Background: `kill <pid>` (SIGTERM) — same

If you have your shell prompt back, the app is down. JSON like `{"error":"Not found"}` on port **3000** is usually Docker, not this service.

## API

`GET /search?q=tr&limit=20`

```json
{
  "success": true,
  "data": [
    { "word": "tree", "definition": "A perennial plant with a trunk..." }
  ],
  "error": null
}
```

| Param | Required | Notes |
|---|---|---|
| `q` | yes | Prefix to match (case-insensitive) |
| `limit` | no | Default 20, max 50 |

## Project layout

```text
client/                 # typeahead UI
src/gateway/            # HTTP edge + static hosting
src/lambda/search/      # dictionary load, trie, handler
src/shared/             # shared types (API Gateway–shaped events)
data/dictionary.json    # word → definition map
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Run TypeScript gateway via `tsx` |
| `npm run build` | Compile to `dist/` |
| `npm run start` | Run compiled gateway |
| `npm test` | Unit + gateway integration tests |
| `npm run status` | Curl `/health` |

## License

Interview practice / personal use. Dictionary text © respective dataset authors (see Hugging Face dataset card; typically Apache-2.0 for that dump).
