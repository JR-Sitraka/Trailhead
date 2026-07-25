'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  FileIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { highlightCode, mapToShikiLang, type HighlightedLines } from '@/lib/shiki';

type TreeNode =
  | { type: 'folder'; name: string; path: string; children: TreeNode[] }
  | { type: 'file'; name: string; path: string; skipped: boolean; skipReason: string | null };

type FileApiRow = {
  id: string;
  path: string;
  size: number;
  language: string | null;
  skipped: boolean;
  skipReason: string | null;
  category: string | null;
};

function buildTree(files: FileApiRow[]): TreeNode[] {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, { type: 'folder'; name: string; path: string; children: TreeNode[] }>();

  const getOrCreateFolder = (path: string, name: string) => {
    if (!folderMap.has(path)) {
      folderMap.set(path, { type: 'folder', name, path, children: [] });
    }
    return folderMap.get(path)!;
  };

  for (const file of files) {
    const parts = file.path.split('/');
    let currentLevel: TreeNode[] = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (isFile) {
        currentLevel.push({
          type: 'file',
          name: part,
          path: file.path,
          skipped: file.skipped,
          skipReason: file.skipReason,
        });
      } else {
        const folder = getOrCreateFolder(currentPath, part);
        if (!currentLevel.some(n => n.type === 'folder' && n.path === currentPath)) {
          currentLevel.push(folder);
        }
        currentLevel = folder.children;
      }
    }
  }

  return root;
}

function FileTreeNode({
  node,
  depth,
  expanded,
  onToggle,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const paddingLeft = 12 + depth * 16;
  if (node.type === 'folder') {
    const isOpen = expanded.has(node.path);
    return (
      <div>
        <button
          type="button"
          onClick={() => onToggle(node.path)}
          style={{ paddingLeft }}
          className="flex w-full items-center gap-1.5 py-1 pr-2 text-left text-sm text-text-primary/90 transition-colors hover:bg-surface-hover"
        >
          <ChevronRightIcon
            className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}
            strokeWidth={2}
          />
          {isOpen ? (
            <FolderOpenIcon className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
          ) : (
            <FolderIcon className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && (
          <div>
            {node.children.map(child => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  const isSelected = node.path === selectedPath;
  return (
    <button
      type="button"
      onClick={() => onSelect(node.path)}
      style={{ paddingLeft: paddingLeft + 18 }}
      className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left text-sm transition-colors ${
        isSelected ? 'bg-primary/10 text-text-primary' : 'text-text-primary/80 hover:bg-surface-hover'
      }`}
    >
      <FileIcon className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
      <span className="truncate font-mono text-[13px]">{node.name}</span>
      {node.skipped && (
        <span
          aria-label="Not analyzed"
          title="Not analyzed"
          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
        />
      )}
    </button>
  );
}

type FileContentResponse = {
  id: string;
  path: string;
  content: string;
  language: string | null;
  size: number;
};

type ExplorerClientProps = {
  repoId: string;
  initialFiles: FileApiRow[];
};

export default function ExplorerClient({ repoId, initialFiles }: ExplorerClientProps) {
  const [files] = useState<FileApiRow[]>(initialFiles);
  const [tree] = useState<TreeNode[]>(() => buildTree(initialFiles));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedLines, setHighlightedLines] = useState<HighlightedLines | null>(null);
  const [highlightError, setHighlightError] = useState(false);

  const handleToggle = useCallback((path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(async (path: string) => {
    setSelectedPath(path);
    setFileContent(null);
    setSkipReason(null);
    setError(null);

    const file = files.find(f => f.path === path);
    if (!file) {
      setError('File not found');
      return;
    }

    if (file.skipped) {
      setSkipReason(file.skipReason ?? 'File was skipped during analysis');
      return;
    }

    setLoading(true);
    setHighlightedLines(null);
    setHighlightError(false);
    try {
      const encodedPath = encodeURIComponent(path);
      const res = await fetch(`/api/repositories/${repoId}/files/${encodedPath}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(body.error || `Failed to load file (${res.status})`);
        setLoading(false);
        return;
      }
      const data: FileContentResponse = await res.json();
      setFileContent(data.content);
      const highlighted = await highlightCode(data.content, data.language);
      if (highlighted) {
        setHighlightedLines({ lines: highlighted.lines, highlighterError: highlighted.highlighterError });
        setHighlightError(highlighted.highlighterError);
      } else {
        setHighlightedLines(null);
        setHighlightError(false);
      }
    } catch {
      setError('Network error loading file content');
    } finally {
      setLoading(false);
    }
  }, [files, repoId]);

  const selectedNode = selectedPath
    ? findNode(tree, selectedPath)
    : null;
  const isSkippedSelected = selectedNode?.type === 'file' && selectedNode.skipped;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] gap-4">
      <div className="w-80 shrink-0 overflow-auto rounded-card border border-border-muted bg-surface">
        <div className="border-b border-border-muted px-3 py-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-muted">Files</h2>
        </div>
        <div className="py-1">
          {tree.map(node => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              expanded={expanded}
              onToggle={handleToggle}
              selectedPath={selectedPath}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-card border border-border-muted bg-surface">
        {!selectedPath && !error && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">Select a file to view its contents</p>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {isSkippedSelected && skipReason && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <AlertTriangleIcon className="h-8 w-8 text-warning" strokeWidth={1.75} />
            <p className="text-sm text-text-muted">{skipReason}</p>
          </div>
        )}

        {loading && !error && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">Loading...</p>
          </div>
        )}

        {fileContent && !isSkippedSelected && !loading && !error && (
          <table className="w-full border-collapse">
            <tbody>
                {(highlightedLines ? highlightedLines.lines : fileContent.split('\n')).map((lineHtml, index) => (
                  <tr key={index} className="hover:bg-surface-hover/50">
                    <td className="w-12 select-none border-r border-border-muted py-0 pr-3 text-right font-mono text-xs text-text-muted">
                      {index + 1}
                    </td>
                    {highlightedLines ? (
                      <td
                        className="whitespace-pre py-0 pl-3 font-mono text-[13px] text-text-primary/90"
                        dangerouslySetInnerHTML={{ __html: lineHtml }}
                      />
                    ) : (
                      <td className="whitespace-pre py-0 pl-3 font-mono text-[13px] text-text-primary/90">
                        {lineHtml}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function findNode(tree: TreeNode[], path: string): TreeNode | null {
  for (const node of tree) {
    if (node.path === path) return node;
    if (node.type === 'folder') {
      const found = findNode(node.children, path);
      if (found) return found;
    }
  }
  return null;
}
