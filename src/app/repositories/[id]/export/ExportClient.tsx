'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { parseInlineCitations, type InlineCitationSegmentOrMarker, type ChatCitation } from '@/lib/chat';
import Link from 'next/link';

type ContextState = 'idle' | 'loading' | 'ready' | 'error';
type JsonState = 'idle' | 'loading' | 'ready' | 'error';
type TaskPacketState = 'idle' | 'loading' | 'ready' | 'error';

type ContextData = {
  content: string;
  generatedVia: 'llm' | 'deterministic-fallback';
  citations: ChatCitation[];
};

type TaskPacketResult = {
  fileId: string;
  path: string;
  startLine: number;
  endLine: number;
  content: string;
};

function SectionHeader({ title, stateCaption }: { title: string; stateCaption: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium text-text-primary">{title}</h2>
      <span className="text-xs text-text-muted">{stateCaption}</span>
    </div>
  );
}

function ActionButtons({ onCopy, onDownload, copyLabel, downloadLabel }: {
  onCopy: () => void;
  onDownload: () => void;
  copyLabel: string;
  downloadLabel: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onCopy}
        className="rounded-control border border-border-muted px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-text-primary"
      >
        {copyLabel}
      </button>
      <button
        onClick={onDownload}
        className="rounded-control border border-border-muted px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-text-primary"
      >
        {downloadLabel}
      </button>
    </div>
  );
}

function InlineCitationText({ segments, repoId }: { segments: InlineCitationSegmentOrMarker[]; repoId: string }) {
  return (
    <div className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          return <span key={i}>{segment.content}</span>;
        }
        return (
          <Link
            key={i}
            href={`/repositories/${repoId}/explorer`}
            className="font-mono text-[13px] text-citation hover:underline"
          >
            [{segment.label}] ({segment.citation.path}:{segment.citation.startLine})
          </Link>
        );
      })}
    </div>
  );
}

function RepositoryContextSection({ repoId }: { repoId: string }) {
  const [state, setState] = useState<ContextState>('loading');
  const [data, setData] = useState<ContextData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState('loading');
      setError(null);
      try {
        const res = await fetch(`/api/repositories/${repoId}/export/context`);
        if (!res.ok) {
          let msg = `Request failed (${res.status})`;
          try {
            const body = await res.json();
            if (body.error) msg = body.error;
          } catch { /* keep default */ }
          if (!cancelled) {
            setError(msg);
            setState('error');
          }
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setState('ready');
        }
      } catch {
        if (!cancelled) {
          setError('Network error. Please try again.');
          setState('error');
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [repoId]);

  const handleCopy = useCallback(async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.content);
  }, [data]);

  const handleDownload = useCallback(() => {
    if (!data) return;
    const blob = new Blob([data.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'REPOSITORY_CONTEXT.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  const labelToCitation = data
    ? new Map(data.citations.map(c => [c.label, c]))
    : new Map();

  const segments: InlineCitationSegmentOrMarker[] = data
    ? parseInlineCitations(data.content, labelToCitation)
    : [];

  return (
    <section className="space-y-3 overflow-hidden rounded-card border border-border-muted bg-surface">
      <div className="border-b border-border-muted px-4 py-2.5">
        <SectionHeader
          title="REPOSITORY_CONTEXT.md"
          stateCaption={state === 'loading' ? 'State: Generating...' : state === 'ready' ? 'State: Generated' : state === 'error' ? 'State: Error' : 'State: Idle'}
        />
      </div>
      <div className="px-4 py-4 space-y-3">
        {state === 'loading' && (
          <p className="text-sm text-text-muted">Generating context summary...</p>
        )}
        {state === 'error' && (
          <p className="text-sm text-danger">{error}</p>
        )}
        {state === 'ready' && data && (
          <>
            {data.generatedVia === 'deterministic-fallback' && (
              <p className="text-xs text-text-muted">
                Generated via deterministic fallback (LLM unavailable or produced non-grounded output).
              </p>
            )}
            <InlineCitationText segments={segments} repoId={repoId} />
            <ActionButtons
              onCopy={handleCopy}
              onDownload={handleDownload}
              copyLabel="Copy"
              downloadLabel="Download .md"
            />
          </>
        )}
      </div>
    </section>
  );
}

function JsonSection({ repoId }: { repoId: string }) {
  const [state, setState] = useState<JsonState>('loading');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState('loading');
      setError(null);
      try {
        const res = await fetch(`/api/repositories/${repoId}/export/json`);
        if (!res.ok) {
          let msg = `Request failed (${res.status})`;
          try {
            const body = await res.json();
            if (body.error) msg = body.error;
          } catch { /* keep default */ }
          if (!cancelled) {
            setError(msg);
            setState('error');
          }
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setState('ready');
        }
      } catch {
        if (!cancelled) {
          setError('Network error. Please try again.');
          setState('error');
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [repoId]);

  const handleCopy = useCallback(async () => {
    if (!data) return;
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  }, [data]);

  const handleDownload = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  return (
    <section className="space-y-3 overflow-hidden rounded-card border border-border-muted bg-surface">
      <div className="flex items-center justify-between border-b border-border-muted px-4 py-2.5">
        <SectionHeader
          title="JSON"
          stateCaption={state === 'loading' ? 'State: Generating...' : state === 'ready' ? 'State: Generated' : state === 'error' ? 'State: Error' : 'State: Idle'}
        />
        {state === 'ready' && (
          <ActionButtons
            onCopy={handleCopy}
            onDownload={handleDownload}
            copyLabel="Copy"
            downloadLabel="Download .json"
          />
        )}
      </div>
      <div className="px-4 py-4">
        {state === 'loading' && (
          <p className="text-sm text-text-muted">Loading JSON export...</p>
        )}
        {state === 'error' && (
          <p className="text-sm text-danger">{error}</p>
        )}
        {state === 'ready' && data && (
          <pre className="overflow-auto rounded-control bg-bg p-4 text-xs leading-relaxed text-text-primary">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </section>
  );
}

function TaskPacketSection({ repoId }: { repoId: string }) {
  const [taskText, setTaskText] = useState('');
  const [results, setResults] = useState<TaskPacketResult[]>([]);
  const [state, setState] = useState<TaskPacketState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!taskText.trim() || state === 'loading') return;

    setState('loading');
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/repositories/${repoId}/export/task-packet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskText }),
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          if (body.error) msg = body.error;
        } catch { /* keep default */ }
        setError(msg);
        setState('error');
        return;
      }

      const json = await res.json();
      setResults(json.results ?? []);
      setState('ready');
    } catch {
      setError('Network error. Please try again.');
      setState('error');
    }
  }, [taskText, repoId, state]);

  const handleCopy = useCallback(async () => {
    if (results.length === 0) return;
    const text = results.map((r, i) =>
      `Result ${i + 1}: ${r.path} (lines ${r.startLine}-${r.endLine})\n${r.content}`
    ).join('\n\n---\n\n');
    await navigator.clipboard.writeText(text);
  }, [results]);

  const handleDownload = useCallback(() => {
    if (results.length === 0) return;
    const data = results.map((r, i) => ({
      rank: i + 1,
      path: r.path,
      startLine: r.startLine,
      endLine: r.endLine,
      content: r.content,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task-packet.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <section className="space-y-3 overflow-hidden rounded-card border border-border-muted bg-surface">
      <div className="border-b border-border-muted px-4 py-2.5">
        <SectionHeader
          title="Task-Packet"
          stateCaption={state === 'loading' ? 'State: Generating...' : state === 'ready' ? 'State: Generated' : state === 'error' ? 'State: Error' : 'State: Idle'}
        />
      </div>
      <div className="px-4 py-4 space-y-3">
        <textarea
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="Describe the task..."
          rows={3}
          className="w-full rounded-control border border-border-muted bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={!taskText.trim() || state === 'loading'}
            className="rounded-control bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
          >
            {state === 'loading' ? 'Generating...' : 'Generate'}
          </button>
          {results.length > 0 && (
            <ActionButtons
              onCopy={handleCopy}
              onDownload={handleDownload}
              copyLabel="Copy results"
              downloadLabel="Download .json"
            />
          )}
        </div>
        {state === 'error' && (
          <p className="text-sm text-danger">{error}</p>
        )}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, i) => (
              <div key={i} className="overflow-hidden rounded-control border border-border-muted bg-bg">
                <div className="border-b border-border-muted px-3 py-2">
                  <span className="font-mono text-xs text-text-primary">
                    {result.path} (lines {result.startLine}-{result.endLine})
                  </span>
                </div>
                <pre className="px-3 py-2 text-xs leading-relaxed text-text-primary whitespace-pre-wrap">
                  {result.content}
                </pre>
              </div>
            ))}
          </div>
        )}
        {state === 'ready' && results.length === 0 && (
          <p className="text-sm text-text-muted">No results found for this task.</p>
        )}
      </div>
    </section>
  );
}

export default function ExportClient({ repoId }: { repoId: string }) {
  return (
    <div className="mx-auto max-w-[800px] space-y-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Export</h1>
      <RepositoryContextSection repoId={repoId} />
      <JsonSection repoId={repoId} />
      <TaskPacketSection repoId={repoId} />
    </div>
  );
}
