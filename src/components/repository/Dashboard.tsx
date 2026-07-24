'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  CodeIcon,
  SearchIcon,
  RefreshCwIcon,
  Trash2Icon,
  FileIcon,
  GitCommitHorizontalIcon,
  XIcon,
  FileArchiveIcon,
  UploadCloudIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { StatusPill } from './StatusPill';
import { RepoRow } from './RepoRow';
import { AddRepositoryModal } from './AddRepositoryModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { ApiRepository, RepoStatus } from './types';

// ---------------------------------------------------------------------------
// Relative-time formatter (Intl.RelativeTimeFormat, zero extra deps)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function fetchRepositories(): Promise<ApiRepository[]> {
  const res = await fetch('/api/repositories');
  if (!res.ok) throw new Error(`Failed to fetch repositories (HTTP ${res.status})`);
  return res.json();
}

async function postRepository(payload: { source: 'github' | 'zip'; url?: string; file?: File }): Promise<ApiRepository> {
  const formData = new FormData();
  formData.append('source', payload.source);
  if (payload.source === 'github' && payload.url) {
    formData.append('url', payload.url);
  }
  if (payload.source === 'zip' && payload.file) {
    formData.append('file', payload.file);
  }

  const res = await fetch('/api/repositories', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `Import failed (HTTP ${res.status})`);
  }
  return res.json();
}

async function deleteRepository(id: string): Promise<void> {
  const res = await fetch(`/api/repositories/${id}`, { method: 'DELETE' });
  if (res.status === 404) return; // already gone
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

// ---------------------------------------------------------------------------
// Status filter configuration
// ---------------------------------------------------------------------------
const STATUS_FILTERS: { label: string; value: RepoStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Ready', value: 'ready' },
  { label: 'Analyzing', value: 'analyzing' },
  { label: 'Queued', value: 'queued' },
  { label: 'Failed', value: 'failed' },
];

// ---------------------------------------------------------------------------
// ROW_GRID: grid-template-columns must align exactly with the header row
// in this component. Header columns: name | commitSha | lastAnalyzed |
// status | actions — do not change one without changing the other.
// ---------------------------------------------------------------------------
const ROW_GRID = 'grid grid-cols-[1fr_120px_140px_110px_1fr] items-center gap-4';

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [repos, setRepos] = useState<ApiRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RepoStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiRepository | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ---- loadRepos (stable identity so polling interval never restarts
  //      just because the repos state changed) ----
  const loadRepos = useCallback(async (signal?: AbortSignal) => {
    const res = await fetch('/api/repositories', { signal });
    if (!res.ok) throw new Error(`Failed to fetch repositories (HTTP ${res.status})`);
    const data: ApiRepository[] = await res.json();
    setRepos(data);
    setLoadError(null);
    return data;
  }, []);

  // ---- initial load ----
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

  // ---- polling: re-fetch every 5 s while any repo is queued/analyzing ----
  useEffect(() => {
    const hasActive = repos.some((r) => r.status === 'queued' || r.status === 'analyzing');

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (!hasActive) return;

    abortRef.current = new AbortController();

    pollingRef.current = setInterval(async () => {
      try {
        await loadRepos(abortRef.current!.signal);
      } catch {
        // Silently ignore aborts; real network errors surface on next manual action
      }
    }, 5000);

    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    };
  }, [repos, loadRepos]);

  // ---- baseline poll: re-fetch every 30 s regardless of local state ----
  useEffect(() => {
    let cancelled = false;
    let baselineAbort: AbortController | null = null;

    const tick = async () => {
      if (cancelled) return;
      baselineAbort = new AbortController();
      try {
        await loadRepos(baselineAbort.signal);
      } catch {
        // Silently ignore aborts and transient errors
      }
    };

    tick();
    const id = setInterval(tick, 30000);

    return () => {
      cancelled = true;
      clearInterval(id);
      if (baselineAbort) baselineAbort.abort();
    };
  }, [loadRepos]);

  // ---- filtered list (client-side) ----
  const filteredRepos = repos.filter((repo) => {
    const matchesStatus = statusFilter === 'all' || repo.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || repo.name.toLowerCase().includes(q) || repo.sourceUrl?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // ---- action handlers ----
  const handleAdd = async (payload: { source: 'github' | 'zip'; url?: string; file?: File }) => {
    const newRepo = await postRepository(payload);
    setRepos((prev) => [newRepo, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleReanalyze = async (repo: ApiRepository) => {
    try {
      await reanalyzeRepository(repo.id);
      setActionError(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reanalyze failed');
    }
  };

  const handleDeleteRequest = (repo: ApiRepository) => {
    setDeleteTarget(repo);
    setActionError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRepository(deleteTarget.id);
      setRepos((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      setActionError(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    setActionError(null);
  };

  // ---- render ----
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
      <div className="rounded-card border border-danger/30 bg-danger/10 px-4 py-3">
        <p className="text-sm text-danger">{loadError}</p>
        <button
          onClick={() => loadRepos()}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Repositories</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage and monitor your imported repositories
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" />
          Add Repository
        </button>
      </div>

      {/* ---- Filters ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-control border border-border-muted bg-bg p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-surface-hover text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter repositories…"
            className="w-full rounded-control border border-border-muted bg-bg py-2 pl-9 pr-3 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* ---- Visible count ---- */}
      <p className="text-xs text-text-muted">
        Showing {filteredRepos.length} of {repos.length} repositories
      </p>

      {/* ---- Global action error (409 from delete/reanalyze) ---- */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            className="flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 px-3 py-2"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-danger">{actionError}</p>
            <button
              onClick={() => setActionError(null)}
              className="ml-auto shrink-0 rounded-control p-0.5 text-danger/70 hover:text-danger"
              aria-label="Dismiss error"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Empty state: zero repositories ever imported ---- */}
      {repos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-card border border-border-muted bg-surface py-16">
          <CodeIcon className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">No repositories yet</p>
          <p className="mt-1 text-sm text-text-muted">
            Import a GitHub repository or ZIP file to get started.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4" />
            Add Repository
          </button>
        </div>
      )}

      {/* ---- Zero-results state: repos exist but none match current filter ---- */}
      {repos.length > 0 && filteredRepos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-card border border-border-muted bg-surface py-16">
          <SearchIcon className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">No matching repositories</p>
          <p className="mt-1 text-sm text-text-muted">
            Try adjusting your filters or search query.
          </p>
        </div>
      )}

      {/* ---- Repository list ---- */}
      {filteredRepos.length > 0 && (
        <div className="space-y-2">
          {/* ---- Header row ---- */}
          <div className={`${ROW_GRID} px-4 py-2 text-xs font-medium uppercase tracking-wider text-text-muted`}>
            <span>Repository</span>
            <span>Commit SHA</span>
            <span>Last Analyzed</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* ---- Data rows ---- */}
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
      )}

      {/* ---- Modals ---- */}
      <AddRepositoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAdd}
      />
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        repoName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
