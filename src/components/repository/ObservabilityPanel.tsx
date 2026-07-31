import React from 'react';
import { ActivityIcon } from 'lucide-react';

// LLM Observability panel — Upgrade item 5 (see
// docs/08-features/observability.md and the ObservabilityPanel block in
// docs/06-components/component-specs.md).
// Passive, global, glanceable. Deliberately NO enforcement/budgeting UI,
// no per-repo breakdown, no charts, no interactive controls — those are
// explicit "must not include" lines in the brief, not omissions.
//
// Ported from the approved Magic Patterns artifact
// cfe1be53-07e0-4903-9e93-7e4412b45e06. Layout, spacing, typography and
// color values are unchanged; only Tailwind token NAMES are mapped to
// this project's real theme (text-muted -> text-text-muted,
// border-border -> border-border-muted, text-text -> text-text-primary),
// which is the naming this codebase actually defines in globals.css.
// The artifact's mock-only state cycler is deliberately not ported.

export type ProviderStatus = 'operational' | 'erroring' | 'unknown';

export interface ObservabilityData {
  /** total generation requests made (today) */
  requests: number;
  /** failed generation requests (today) */
  failures: number;
  providerStatus: ProviderStatus;
  providerName: string;
}

interface ObservabilityPanelProps {
  /** null = metrics unavailable — rendered as an honest, distinct state,
   *  never as fake zeros (brief's honest-states requirement). */
  data: ObservabilityData | null;
}

const PROVIDER_CONFIG: Record<
  ProviderStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  // Same status-color vocabulary as StatusPill — ready-green /
  // failed-red / muted — reused, not reinvented.
  operational: {
    label: 'Operational',
    color: '#3FB950',
    bg: 'rgba(63, 185, 80, 0.10)',
    border: 'rgba(63, 185, 80, 0.35)',
  },
  erroring: {
    label: 'Erroring',
    color: '#E5484D',
    bg: 'rgba(229, 72, 77, 0.10)',
    border: 'rgba(229, 72, 77, 0.35)',
  },
  unknown: {
    label: 'Unknown',
    color: '#8A94A6',
    bg: 'rgba(138, 148, 166, 0.10)',
    border: 'rgba(138, 148, 166, 0.30)',
  },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <span className="font-mono text-sm text-text-primary">{value}</span>
    </div>
  );
}

export function ObservabilityPanel({ data }: ObservabilityPanelProps) {
  return (
    <section
      aria-label="LLM observability"
      className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-border-muted bg-surface px-4 py-2.5"
    >
      <div className="flex items-center gap-2 text-text-muted">
        <ActivityIcon className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="text-[11px] font-medium uppercase tracking-wide">
          LLM observability
        </span>
      </div>

      {data === null ? (
        // Metrics-unavailable state — explicitly distinct from real zeros.
        <span className="text-xs text-text-muted">
          <span className="font-mono">—</span> metrics unavailable
        </span>
      ) : (
        <>
          {/* True zeros render as real zeros — a valid state, per brief. */}
          <Stat label="Requests" value={String(data.requests)} />
          <Stat label="Failures" value={String(data.failures)} />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Provider
            </span>
            {(() => {
              const cfg = PROVIDER_CONFIG[data.providerStatus];
              return (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5"
                  style={{
                    color: cfg.color,
                    backgroundColor: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  {data.providerName} · {cfg.label}
                </span>
              );
            })()}
          </div>
        </>
      )}
    </section>
  );
}
