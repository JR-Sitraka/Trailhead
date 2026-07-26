'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangleIcon, XIcon } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  repoName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ isOpen, repoName, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cancelButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setConfirming(false);
      setError(null);
      setTimeout(() => cancelButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError(null);
    try {
      setConfirming(true);
      await onConfirm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete repository.';
      setError(message);
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    if (!confirming) onCancel();
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirming) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirming, onCancel]);

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
            aria-labelledby="delete-repo-title"
            className="w-full max-w-md rounded-card border border-border-muted bg-surface p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="delete-repo-title" className="text-lg font-semibold text-text-primary">
                Delete Repository
              </h2>
              <button
                onClick={handleCancel}
                disabled={confirming}
                className="rounded-control p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                aria-label="Close dialog"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-text-primary">
              Are you sure you want to delete{' '}
              <span className="font-medium">{repoName}</span>? This action cannot be undone.
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 px-3 py-2">
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={handleCancel}
                disabled={confirming}
                className="rounded-control border border-border-muted px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="rounded-control bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
              >
                {confirming ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
