import React from "react";
import { db } from "@/server/db";
import { repositories, files, analysisJobs } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { detectStackFacts, type FileRow as StackFactsFileRow } from "@/server/services/stackFacts";
import { AlertTriangleIcon } from "lucide-react";

function Section({ title, children, tone = "default" }: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <section
      className={`overflow-hidden rounded-card border bg-surface ${
        tone === "warning" ? "border-warning/30" : "border-border-muted"
      }`}
    >
      <div
        className={`flex items-center gap-2 border-b px-4 py-2.5 ${
          tone === "warning" ? "border-warning/30" : "border-border-muted"
        }`}
      >
        {tone === "warning" && (
          <AlertTriangleIcon className="h-3.5 w-3.5 text-warning" strokeWidth={2} />
        )}
        <h2
          className={`text-[11px] font-medium uppercase tracking-wide ${
            tone === "warning" ? "text-warning" : "text-text-muted"
          }`}
        >
          {title}
        </h2>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-mono text-[13px] text-text-primary">{value}</span>
    </div>
  );
}

function PathList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="font-mono text-[13px] text-text-primary/90">
          {item}
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-text-muted">{message}</p>
  );
}

export const displayValue = (value: string | null, fallback: string) => (value ? value : fallback);

export default async function OverviewPage({ params }: { params: { id: string } }) {
  const repo = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, params.id))
    .then((r) => r[0]);

  if (!repo) {
    notFound();
  }

  const [latestJob] = await db
    .select()
    .from(analysisJobs)
    .where(eq(analysisJobs.repositoryId, params.id))
    .orderBy(desc(analysisJobs.createdAt))
    .limit(1)
    .then((r) => r);

  const repoFiles = await db
    .select()
    .from(files)
    .where(eq(files.repositoryId, params.id));

  const fileRows: StackFactsFileRow[] = repoFiles.map((f) => ({
    path: f.path,
    language: f.language,
    skipped: f.skipped,
    content: f.content,
  }));

  const stack = detectStackFacts(fileRows);

  const labelMap: Record<string, string> = {
    primaryLanguage: "Primary Language",
    framework: "Framework",
    packageManager: "Package Manager",
    buildTool: "Build Tool",
    testFrameworkSummary: "Test Framework",
  };

  const entrypoints = repoFiles.filter((f) => f.category === "entrypoint").map((f) => f.path);
  const configFiles = repoFiles.filter((f) => f.category === "config").map((f) => f.path);
  const skippedFiles = repoFiles.filter((f) => f.skipped && f.skipReason);
  const hasSkipped = skippedFiles.length > 0;

  const notReady = repo.status !== "ready";

  return (
    <div className="space-y-6">
      {notReady && (
        <Section title={`Status: ${repo.status}`} tone="warning">
          <p className="text-sm text-text-muted">
            This repository has not finished analysis. The information below may be incomplete.
          </p>
        </Section>
      )}

      <Section
        title="Stack"
        tone={repo.status === "failed" || notReady ? "warning" : "default"}
      >
        {(["primaryLanguage", "framework", "packageManager", "buildTool", "testFrameworkSummary"] as const).map((field) => (
          <FactRow
            key={field}
            label={labelMap[field]}
            value={displayValue(stack[field], "Unknown")}
          />
        ))}
      </Section>

      <Section title="Entry points">
        {entrypoints.length > 0 ? (
          <PathList items={entrypoints} />
        ) : (
          <EmptyState message="No entry points detected" />
        )}
      </Section>

      <Section title="Configuration files">
        {configFiles.length > 0 ? (
          <PathList items={configFiles} />
        ) : (
          <EmptyState message="No configuration files detected" />
        )}
      </Section>

      <Section title="Testing">
        {stack.testFrameworkSummary ? (
          <FactRow label="Test framework" value={stack.testFrameworkSummary} />
        ) : (
          <EmptyState message="No test framework detected" />
        )}
      </Section>

      {hasSkipped && (
        <Section title="Not analyzed" tone="warning">
          {latestJob?.truncated && (
            <p className="mb-3 text-xs text-text-muted">
              Analysis hit the 5,000-file truncation limit; some files beyond this point were not analyzed.
            </p>
          )}
          <ul className="space-y-3">
            {skippedFiles.map((f) => (
              <li key={f.id} className="flex flex-col gap-0.5">
                <span className="font-mono text-[13px] text-text-primary/90">{f.path}</span>
                <span className="text-xs text-text-muted">{f.skipReason}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
