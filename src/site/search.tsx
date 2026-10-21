import React, { useEffect, useMemo, useState } from "react";

type Entry = {
  title: string;
  description: string;
  path: string;
  locale: string;
  text: string;
};
const normalise = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ");
function Search({
  hint,
  empty,
  initialQuery = "",
}: {
  hint: string;
  empty: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const lifetime = new AbortController();
    fetch("/search.json", { signal: lifetime.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Search index unavailable");
        const data: Entry[] = await response.json();
        if (!lifetime.signal.aborted)
          setEntries(
            data.filter(
              (entry) =>
                entry.locale === document.documentElement.lang ||
                entry.locale === "en",
            ),
          );
      })
      .catch(() => {
        if (!lifetime.signal.aborted) setError(true);
      });
    return () => lifetime.abort();
  }, []);
  const indexed = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        match: normalise(`${entry.title} ${entry.description} ${entry.text}`),
      })),
    [entries],
  );
  const words = normalise(query).trim().split(/\s+/).filter(Boolean);
  const matches = words.length
    ? indexed
        .filter((entry) => words.every((word) => entry.match.includes(word)))
        .sort(
          (a, b) =>
            Number(normalise(b.title).includes(words[0])) -
            Number(normalise(a.title).includes(words[0])),
        )
        .slice(0, 12)
    : [];
  return (
    <>
      <label className="sr-only" htmlFor="query">
        {hint}
      </label>
      <input
        id="query"
        type="search"
        placeholder={hint}
        autoComplete="off"
        maxLength={200}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div id="search-results" aria-live="polite">
        {error ? (
          <p>
            {document.documentElement.lang === "es"
              ? "La búsqueda no está disponible. Usa la navegación."
              : "Search is unavailable. Use the page navigation."}
          </p>
        ) : (
          matches.map((entry) => (
            <a key={entry.path} href={entry.path}>
              <strong>{entry.title}</strong>
              <small>{entry.description}</small>
            </a>
          ))
        )}
        {!error &&
          words.length > 0 &&
          matches.length === 0 &&
          entries.length > 0 && <p>{empty}</p>}
      </div>
    </>
  );
}
export async function mountSearch(host: HTMLElement) {
  const { hydrateRoot } = await import("react-dom/client");
  return hydrateRoot(
    host,
    <Search
      hint={host.dataset.hint ?? ""}
      empty={host.dataset.empty ?? ""}
      initialQuery={host.querySelector<HTMLInputElement>("input")?.value ?? ""}
    />,
  );
}
