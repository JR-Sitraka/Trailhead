import React from 'react';

import { MessageSquarePlusIcon } from 'lucide-react';

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export default function NewConversationButton({ onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-control border border-border-muted bg-surface px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="New conversation"
    >
      <MessageSquarePlusIcon className="h-3.5 w-3.5" strokeWidth={2} />
      New conversation
    </button>
  );
}
