'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, CodeIcon, SearchIcon, RefreshCwIcon, XIcon, AlertTriangleIcon } from 'lucide-react';
import { RepoRow } from './RepoRow';
import { AddRepositoryModal } from './AddRepositoryModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { ApiRepository, RepoStatus } from './types';

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffSeconds = Math.round((now - then) / 1000);
  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return rtf.format(-diffSeconds, 'second');
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return rtf.format(-diffDays, 'day');
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return rtf.format(-diffMonths, 'month');
  const diffYears = Math.round(diffMonths / 12);
  return rtf.format(-diffYears, 'year');
}

function getDisplayTime(repo: ApiRepository): string {
  if (repo.status === 'queued') return 'Queued just now';
  if (repo.status === 'analyzing') return 'Running…';
  const ts = repo.analysisJob?.embeddingCompletedAt ?? repo.updatedAt;
  if (!ts) return 'Never';
  return formatRelativeTime(ts);
}

async function postRepository(payload: { source: 'github' | 'zip'; url?: string; file?: File }): Promise<ApiRepository> {
  const formData = new FormData();
  formData.append('source', payload.source);
  if (payload.source === 'github' && payload.url) formData.append('url', payload.url);
  if (payload.source === 'zip' && payload.file) formData.append('file', payload.file);
  const res = await fetch('/api/repositories', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `Import failed (HTTP ${res.status})`);
  }
  return res.json();
}

async function deleteRepository(id: string): Promise<void> {
  const res = await fetch(`/api/repositories/${id}`, { method: 'DELETE' });
  if (res.status === 404) return;
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    if (res.status === 409) throw new Error(body.error || 'Cannot delete — analysis is currently in progress');
    throw new Error(body.error || `Delete failed (HTTP ${res.status})`);
  }
}

async function reanalyzeRepository(id: string): Promise<void> {
  const res = await fetch(`/api/repositories/${id}/reanalyze`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    if (res.status === 409) throw new Error(body.error || 'An analysis is already in progress');
    throw new Error(body.error || `Reanalyze failed (HTTP ${res.status})`);
  }
}

const FILTERS: { id: 'all' | RepoStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ready', label: 'Ready' },
  { id: 'analyzing', label: 'Analyzing' },
  { id: 'queued', label: 'Queued' },
  { id: 'failed', label: 'Failed' },
];

// HEADER_GRID: must stay identical (string-for-string) to ROW_GRID in
// RepoRow.tsx — see the comment there for why explicit widths are
// required for the header and rows to actually align.
const HEADER_GRID = 'grid grid-cols-[minmax(0,1.6fr)_110px_110px_140px_230px] items-center gap-4';

export default function Dashboard() {
  const [repos, setRepos] = useState<ApiRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | RepoStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiRepository | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadRepos = useCallback(async (signal?: AbortSignal) => {
    const res = await fetch('/api/repositories', { signal });
    if (!res.ok) throw new Error(`Failed to fetch repositories (HTTP ${res.status})`);
    const data: ApiRepository[] = await res.json();
    setRepos(data);
    setLoadError(null);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadRepos();
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === 'AbortError')) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load repositories');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadRepos]);

  useEffect(() => {
    const hasActive = repos.some((r) => r.status === 'queued' || r.status === 'analyzing');
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    if (!hasActive) return;
    abortRef.current = new AbortController();
    pollingRef.current = setInterval(async () => {
      try { await loadRepos(abortRef.current!.signal); } catch { /* ignore aborts */ }
    }, 5000);
    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    };
  }, [repos, loadRepos]);

  useEffect(() => {
    let cancelled = false;
    let baselineAbort: AbortController | null = null;
    const tick = async () => {
      if (cancelled) return;
      baselineAbort = new AbortController();
      try { await loadRepos(baselineAbort.signal); } catch { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => { cancelled = true; clearInterval(id); if (baselineAbort) baselineAbort.abort(); };
  }, [loadRepos]);

  const filteredRepos = useMemo(() => repos.filter((repo) => {
    const matchesStatus = statusFilter === 'all' || repo.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || repo.name.toLowerCase().includes(q) || (repo.sourceUrl?.toLowerCase().includes(q) ?? false);
    return matchesStatus && matchesSearch;
  }), [repos, statusFilter, searchQuery]);

  const handleAdd = async (payload: { source: 'github' | 'zip'; url?: string; file?: File }) => {
    const newRepo = await postRepository(payload);
    setRepos((prev) => [newRepo, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleReanalyze = async (repo: ApiRepository) => {
    try { await reanalyzeRepository(repo.id); setActionError(null); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Reanalyze failed'); }
  };

  const handleDeleteRequest = (repo: ApiRepository) => { setDeleteTarget(repo); setActionError(null); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRepository(deleteTarget.id);
      setRepos((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      setActionError(null);
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const handleDeleteCancel = () => { setDeleteTarget(null); setActionError(null); };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCwIcon className="h-6 w-6 animate-spin text-text-muted" />
        <span className="ml-3 text-sm text-text-muted">Loading repositories…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-card border border-danger/30 bg-danger/10 px-4 py-3">
          <p className="text-sm text-danger">{loadError}</p>
          <button onClick={() => loadRepos()} className="mt-2 text-sm text-primary hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  const hasAnyRepos = repos.length > 0;
  const hasVisibleRepos = filteredRepos.length > 0;
  const isFiltered = statusFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="min-h-full w-full font-sans">
      {/* Toolbar */}
      <header className="sticky top-0 z-10 border-b border-border-muted bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-white">
              <CodeIcon className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <h1 className="text-sm font-semibold text-text-primary">Trailhead</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter repositories…"
                aria-label="Filter repositories"
                className="w-56 rounded-control border border-border-muted bg-surface py-1.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-control bg-primary px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={2.25} />
              Add repository
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Page heading row */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Repositories</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {isFiltered && hasAnyRepos
                ? `${filteredRepos.length} of ${repos.length} repositories · structural analysis`
                : `${repos.length} ${repos.length === 1 ? 'repository' : 'repositories'} · structural analysis`}
            </p>
          </div>
          {hasAnyRepos && (
            <div className="flex items-center gap-1 overflow-x-auto">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`shrink-0 rounded-control px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    statusFilter === f.id ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global action error (409 from delete/reanalyze) */}
        <AnimatePresence>
          {actionError && (
            <motion.div
              className="mb-4 flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 px-3 py-2"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            >
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <p className="text-sm text-danger">{actionError}</p>
              <button onClick={() => setActionError(null)} className="ml-auto shrink-0 rounded-control p-0.5 text-danger/70 hover:text-danger" aria-label="Dismiss error">
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {hasAnyRepos ? (
          <section aria-label="Imported repositories" className="overflow-hidden rounded-card border border-border-muted bg-surface">
            {hasVisibleRepos ? (
              <>
                <div className={`${HEADER_GRID} border-b border-border-muted px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-text-muted`}>
                  <span>Repository</span>
                  <span className="justify-self-start">Status</span>
                  <span className="justify-self-start">Last commit</span>
                  <span className="justify-self-start">Updated</span>
                  <span className="justify-self-end">Actions</span>
                </div>
                <div className="divide-y divide-border-muted">
                  {filteredRepos.map((repo) => (
                    <RepoRow
                      key={repo.id}
                      repo={{
                        id: repo.id,
                        name: repo.name,
                        path: repo.name,
                        status: repo.status,
                        commitSha: repo.commitSha,
                        lastAnalyzed: getDisplayTime(repo),
                        source: repo.source,
                      }}
                      onReanalyze={() => handleReanalyze(repo)}
                      onDelete={() => handleDeleteRequest(repo)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border-muted bg-surface px-6 py-16 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-card border border-border-muted bg-bg text-text-muted">
                  <SearchIcon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <p className="text-sm text-text-primary">No repositories match</p>
                <p className="mt-1 text-xs text-text-muted">Adjust your filters or add a new repository to analyze.</p>
              </div>
            )}
          </section>
        ) : (
          <section aria-label="No repositories imported" className="flex flex-col items-center justify-center rounded-card border border-dashed border-border-muted bg-surface px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-card border border-border-muted bg-bg text-text-muted">
              <CodeIcon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-medium text-text-primary">No repositories yet — import one to get started</p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex shrink-0 items-center gap-1.5 rounded-control bg-primary px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={2.25} />
              Add repository
            </button>
          </section>
        )}

        {hasAnyRepos && (
          <p className="mt-4 text-center text-xs text-text-muted">
            Reanalysis is manual — use the Reanalyze action on a repository to refresh its analysis against the latest commit.
          </p>
        )}
      </main>

      <AddRepositoryModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAdd} />
      <ConfirmDeleteModal isOpen={!!deleteTarget} repoName={deleteTarget?.name ?? ''} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />
    </div>
  );
}
