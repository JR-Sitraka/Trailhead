/** @vitest-environment happy-dom */

import React, { useState } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddRepositoryModal } from '../src/components/repository/AddRepositoryModal';
import { ConfirmDeleteModal } from '../src/components/repository/ConfirmDeleteModal';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function AddRepositoryHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open Add Repository</button>
      <AddRepositoryModal isOpen={open} onClose={() => setOpen(false)} onAdd={async () => {}} />
    </div>
  );
}

function ConfirmDeleteHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Delete escape-string-regexp</button>
      <ConfirmDeleteModal
        isOpen={open}
        repoName="escape-string-regexp"
        onConfirm={async () => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

describe('AddRepositoryModal focus trap', () => {
  it('never lets Tab or Shift+Tab move focus outside the dialog', async () => {
    const user = userEvent.setup();
    render(<AddRepositoryHarness />);

    const trigger = screen.getByText('Open Add Repository');
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog');

    // Tab forward well past the number of focusable elements in the dialog.
    for (let i = 0; i < 12; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    // Shift+Tab backward the same amount.
    for (let i = 0; i < 12; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('restores focus to the triggering element on close', async () => {
    const user = userEvent.setup();
    render(<AddRepositoryHarness />);

    const trigger = screen.getByText('Open Add Repository');
    await user.click(trigger);

    await screen.findByRole('dialog');

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('keeps the hidden ZIP file input out of the tab cycle', async () => {
    const user = userEvent.setup();
    render(<AddRepositoryHarness />);

    await user.click(screen.getByText('Open Add Repository'));
    const dialog = await screen.findByRole('dialog');

    await user.click(screen.getByText('ZIP'));

    for (let i = 0; i < 10; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect((document.activeElement as HTMLElement).getAttribute('type')).not.toBe('file');
    }
  });
});

describe('ConfirmDeleteModal focus trap', () => {
  it('never lets Tab or Shift+Tab move focus outside the dialog', async () => {
    const user = userEvent.setup();
    render(<ConfirmDeleteHarness />);

    await user.click(screen.getByText('Delete escape-string-regexp'));
    const dialog = await screen.findByRole('dialog');

    for (let i = 0; i < 10; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    for (let i = 0; i < 10; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('restores focus to the triggering Delete button on cancel', async () => {
    const user = userEvent.setup();
    render(<ConfirmDeleteHarness />);

    const trigger = screen.getByText('Delete escape-string-regexp');
    await user.click(trigger);

    await screen.findByRole('dialog');

    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('announces which repository will be deleted via aria-describedby on the dialog itself', async () => {
    const user = userEvent.setup();
    render(<ConfirmDeleteHarness />);

    await user.click(screen.getByText('Delete escape-string-regexp'));
    const dialog = await screen.findByRole('dialog');

    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const description = document.getElementById(describedBy!);
    expect(description).not.toBeNull();
    expect(description!.textContent).toContain('escape-string-regexp');
  });
});
