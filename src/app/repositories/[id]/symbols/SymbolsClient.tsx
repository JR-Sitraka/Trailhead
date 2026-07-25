'use client';

import React, { useState, useEffect, useCallback } from 'react';

type SymbolKind = 'function' | 'class' | 'interface' | 'import' | 'export';

interface SymbolEntry {
  id: string;
  kind: SymbolKind;
  name: string;
  path: string;
  startLine: number;
  endLine: number;
}

const KIND_CONFIG: Record<SymbolKind, { label: string; color: string; bg: string }> = {
  function:  { label: 'fn',    color: '#8FB8FF', bg: 'rgba(76,141,255,0.10)' },
  class:     { label: 'class', color: '#B7A6FF', bg: 'rgba(167,139,250,0.10)' },
  interface: { label: 'iface', color: '#7FDCC0', bg: 'rgba(45,212,168,0.10)' },
  import:    { label: 'import',color: '#7DB8D9', bg: 'rgba(88,169,209,0.10)' },
  export:    { label: 'export',color: '#D9A672', bg: 'rgba(196,148,86,0.10)' },
};

const FILTERS: { id: 'all' | SymbolKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'function', label: 'Functions' },
  { id: 'class', label: 'Classes' },
  { id: 'interface', label: 'Interfaces' },
  { id: 'import', label: 'Imports' },
  { id: 'export', label: 'Exports' },
];

export function formatLines(startLine: number, endLine: number): string {
  return startLine === endLine ? `${startLine}` : `${startLine}\u2013${endLine}`;
}

function KindBadge({ kind }: { kind: SymbolKind }) {
  const cfg = KIND_CONFIG[kind];
  return (
    <span
      className="inline-flex w-16 shrink-0 items-center justify-center rounded-control py-1 font-mono text-[11px] font-medium"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

type Props = {
  repoId: string;
};

export default function SymbolsClient({ repoId }: Props) {
  const [filter, setFilter] = useState<'all' | SymbolKind>('all');
  const [symbols, setSymbols] = useState<SymbolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSymbols = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`/api/repositories/${repoId}/symbols`, window.location.origin);
      if (filter !== 'all') {
        url.searchParams.set('kind', filter);
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(body.error || `Failed to load symbols (${res.status})`);
      }
      const data: SymbolEntry[] = await res.json();
      setSymbols(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load symbols');
    } finally {
      setLoading(false);
    }
  }, [repoId, filter]);

  useEffect(() => {
    fetchSymbols();
  }, [fetchSymbols]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-control border px-3 py-1.5 text-sm transition-colors ${
              filter === f.id
                ? 'border-primary bg-primary/10 text-text-primary'
                : 'border-border-muted text-text-muted hover:text-text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      {loading && !error && (
        <p className="text-sm text-text-muted">Loading...</p>
      )}

      {!loading && !error && symbols.length === 0 && (
        <p className="text-sm text-text-muted">No symbols found</p>
      )}

      {!loading && !error && symbols.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border-muted bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-muted">
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Kind</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Path</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-text-muted">Lines</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((sym) => (
                <tr key={sym.id} className="border-b border-border-muted/50 hover:bg-surface-hover/50">
                  <td className="px-4 py-2.5">
                    <KindBadge kind={sym.kind} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-text-primary/90">{sym.name}</td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-text-primary/80">{sym.path}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-[13px] text-text-muted">
                    {formatLines(sym.startLine, sym.endLine)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
