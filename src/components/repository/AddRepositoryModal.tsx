'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  FileArchiveIcon,
  UploadCloudIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import type { RepoSource } from './types';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

interface AddRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: { source: RepoSource; url?: string; file?: File }) => Promise<void>;
}

type Tab = 'github' | 'zip';

export function AddRepositoryModal({ isOpen, onClose, onAdd }: AddRepositoryModalProps) {
  const [tab, setTab] = useState<Tab>('github');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [isOpen, tab]);

  useEffect(() => {
    if (!isOpen) {
      setTab('github');
      setUrl('');
      setFile(null);
      setSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === 'github') {
      const trimmed = url.trim();
      if (!trimmed) {
        setError('Please enter a GitHub repository URL.');
        return;
      }
      try {
        setSubmitting(true);
        await onAdd({ source: 'github', url: trimmed });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import repository.';
        setError(message);
        setSubmitting(false);
      }
    } else {
      if (!file) {
        setError('Please select a ZIP file to upload.');
        return;
      }
      try {
        setSubmitting(true);
        await onAdd({ source: 'zip', file });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import repository.';
        setError(message);
        setSubmitting(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-repo-title"
            className="w-full max-w-lg rounded-card border border-border-muted bg-surface p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 id="add-repo-title" className="text-lg font-semibold text-text-primary">
                Add Repository
              </h2>
              <button
                onClick={handleClose}
                disabled={submitting}
                className="rounded-control p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                aria-label="Close dialog"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex rounded-control border border-border-muted bg-bg p-0.5">
              <button
                type="button"
                onClick={() => setTab('github')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === 'github'
                    ? 'bg-surface-hover text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <GithubIcon className="h-4 w-4" />
                GitHub
              </button>
              <button
                type="button"
                onClick={() => setTab('zip')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === 'zip'
                    ? 'bg-surface-hover text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <FileArchiveIcon className="h-4 w-4" />
                ZIP
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {tab === 'github' ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="github-url" className="mb-1.5 block text-sm text-text-primary">
                      GitHub Repository URL
                    </label>
                    <input
                      ref={urlInputRef}
                      id="github-url"
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo"
                      disabled={submitting}
                      className="w-full rounded-control border border-border-muted bg-bg px-3 py-2 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    Enter a public GitHub repository URL. The repository will be imported and queued for analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="zip-file" className="mb-1.5 block text-sm text-text-primary">
                      ZIP Archive
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-control border border-border-muted border-dashed bg-bg px-4 py-8 text-center transition-colors hover:border-primary hover:bg-surface-hover"
                    >
                      <UploadCloudIcon className="mb-2 h-8 w-8 text-text-muted" />
                      {file ? (
                        <span className="text-sm text-text-primary">{file.name}</span>
                      ) : (
                        <>
                          <span className="text-sm text-text-primary">Click to select a ZIP file</span>
                          <span className="mt-1 text-xs text-text-muted">Max 150 MB</span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        id="zip-file"
                        type="file"
                        accept=".zip,application/zip"
                        onChange={handleFileChange}
                        disabled={submitting}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 px-3 py-2">
                  <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="rounded-control border border-border-muted px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-control bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Importing…' : 'Import'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
