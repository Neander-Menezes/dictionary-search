const input = document.getElementById("q");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

const DEBOUNCE_MS = 200;
let debounceTimer = null;
let requestId = 0;

function setStatus(message) {
  statusEl.textContent = message;
}

function renderResults(items) {
  resultsEl.replaceChildren();

  for (const item of items) {
    const li = document.createElement("li");

    const word = document.createElement("span");
    word.className = "word";
    word.textContent = item.word;

    const definition = document.createElement("p");
    definition.className = "definition";
    definition.textContent = item.definition || "(no definition)";

    li.append(word, definition);
    resultsEl.append(li);
  }
}

async function search(query) {
  const id = ++requestId;
  const url = `/search?q=${encodeURIComponent(query)}&limit=20`;

  setStatus("Searching…");

  try {
    const response = await fetch(url);
    const payload = await response.json();

    if (id !== requestId) {
      return;
    }

    if (!response.ok || !payload.success) {
      setStatus(payload.error || "Search failed");
      renderResults([]);
      return;
    }

    const items = payload.data ?? [];
    if (items.length === 0) {
      setStatus("No matches");
      renderResults([]);
      return;
    }

    setStatus(`${items.length} match${items.length === 1 ? "" : "es"}`);
    renderResults(items);
  } catch (error) {
    if (id !== requestId) {
      return;
    }
    console.error(error);
    setStatus("Could not reach search service");
    renderResults([]);
  }
}

input.addEventListener("input", () => {
  const query = input.value.trim();
  window.clearTimeout(debounceTimer);

  if (!query) {
    requestId += 1;
    setStatus("");
    renderResults([]);
    return;
  }

  debounceTimer = window.setTimeout(() => {
    search(query);
  }, DEBOUNCE_MS);
});

input.focus();
