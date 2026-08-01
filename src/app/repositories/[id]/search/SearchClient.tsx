'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SearchIcon, ChevronDownIcon } from 'lucide-react';

interface SearchResultItem {
  fileId: string;
  path: string;
  line: number;
  snippet: string;
}

const FILE_TYPES = ['All types', '.ts', '.tsx', '.json'];
const DEBOUNCE_MS = 300;
const MAX_RESULTS = 50;

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <>
      {before}
      <span className="rounded-sm bg-primary/25 text-text-primary">{match}</span>
      {after}
    </>
  );
}

type Props = {
  repoId: string;
};

export default function SearchClient({ repoId }: Props) {
  const [query, setQuery] = useState('');
  const [fileType, setFileType] = useState('All types');
  const [pathPrefix, setPathPrefix] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (q: string, ft: string, pp: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortController.current = controller;

    try {
      const url = new URL(`/api/repositories/${repoId}/search`, window.location.origin);
      url.searchParams.set('q', q.trim());
      if (ft !== 'All types' && ft) {
        url.searchParams.set('fileType', ft.startsWith('.') ? ft : `.${ft}`);
      }
      if (pp.trim()) {
        url.searchParams.set('pathPrefix', pp.trim());
      }

      const res = await fetch(url.toString(), { signal: controller.signal });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `Search failed (${res.status})` }));
        throw new Error(body.error || `Search failed (${res.status})`);
      }

      const data: SearchResultItem[] = await res.json();
      setResults(data);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      if (abortController.current === controller) {
        setLoading(false);
        abortController.current = null;
      }
    }
  }, [repoId]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (abortController.current) {
      abortController.current.abort();
    }

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query, fileType, pathPrefix);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, fileType, pathPrefix, performSearch]);

  const hasQuery = query.trim().length > 0;
  const showResults = !loading && !error && hasQuery;
  const showZeroResults = showResults && results.length === 0;
  const showResultList = showResults && results.length > 0;

  let statusMessage = '';
  if (loading && hasQuery) {
    statusMessage = 'Searching…';
  } else if (showZeroResults) {
    statusMessage = 'No matches found.';
  } else if (showResultList) {
    statusMessage = `${results.length} result${results.length === 1 ? '' : 's'} found.`;
  }

  return (
    <div className="space-y-4">
      <div aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symbol name, route, env var, or exact string…"
            className="w-full rounded-card border border-border-muted bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            aria-label="Search repository"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="appearance-none rounded-control border border-border-muted bg-bg px-3 py-1.5 pr-8 text-sm text-text-primary focus:border-primary focus:outline-none"
              aria-label="Filter by file type"
            >
              {FILE_TYPES.map((ft) => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          </div>

          <input
            type="text"
            value={pathPrefix}
            onChange={(e) => setPathPrefix(e.target.value)}
            placeholder="Filter by path, e.g. src/lib"
            className="flex-1 rounded-control border border-border-muted bg-bg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            aria-label="Filter by path prefix"
          />
        </div>
      </div>

      {!hasQuery && !loading && (
        <p className="text-sm text-text-muted">Start typing to search this repository</p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading && hasQuery && (
        <p className="text-sm text-text-muted">Searching…</p>
      )}

      {showZeroResults && (
        <div className="rounded-card border border-border-muted bg-surface p-6">
          <p className="text-sm font-medium text-text-primary">No matches.</p>
          <p className="mt-2 text-sm text-text-muted">
            Search is exact and full-text only — it won&apos;t find
            conceptually related results with different wording.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            Try Chat for conceptual questions instead.
          </p>
        </div>
      )}

      {showResultList && (
        <div className="overflow-hidden rounded-card border border-border-muted bg-surface">
          <div className="max-h-[600px] overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.fileId + result.line + result.snippet}
                className="border-b border-border-muted/50 px-4 py-3 last:border-b-0 hover:bg-surface-hover/50"
              >
                <div className="flex items-center gap-3">
                  <span className="whitespace-nowrap font-mono text-[13px] text-text-muted">
                    {result.path}
                  </span>
                  <span className="whitespace-nowrap font-mono text-[13px] text-text-muted">
                    :{result.line}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-[13px] text-text-primary/80">
                  <Highlight text={result.snippet} query={query} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showResults && results.length > 0 && (
        <p className="text-xs text-text-muted">
          Files skipped during analysis aren&apos;t included in search results.
        </p>
      )}
    </div>
  );
}
