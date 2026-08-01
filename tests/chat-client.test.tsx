/** @vitest-environment happy-dom */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatClient from '../src/app/repositories/[id]/chat/ChatClient';

const REPO_ID = 'chat-test-repo';

function mockFetchSuccess(status: string, answer: string, citations: number[] = []) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ status, answer, citations }),
  });
}

function mockFetchFailure(status: number, errorMessage: string) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: errorMessage }),
  });
}

function mockFetchNetworkError() {
  (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
}

describe('ChatClient frontend logic', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (global as any).fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders empty thread with input and new conversation button', () => {
    render(<ChatClient repoId={REPO_ID} />);
    expect(screen.getByLabelText('Ask a follow-up question')).toBeDefined();
    expect(screen.getByLabelText('New conversation')).toBeDefined();
    expect(screen.getByText('Chat')).toBeDefined();
  });

  it('submits a question and shows answered AnswerCard with inline citations', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('answered', 'Auth is handled in src/auth/middleware.ts[1] and passes through[2].', [1, 2]);

    const input = screen.getByLabelText('Ask a follow-up question');
    await user.type(input, 'Where is authentication handled?');

    const askButton = screen.getByLabelText('Ask');
    await user.click(askButton);

    await waitFor(() => {
      expect(screen.getByText(/Auth is handled in/)).toBeDefined();
    });

    expect(screen.getAllByText(/\[1\]/)).toHaveLength(1);
    expect(screen.getAllByText(/\[2\]/)).toHaveLength(1);
    expect(screen.queryAllByText(/\[3\]/)).toHaveLength(0);
    expect((input as HTMLInputElement).value).toBe('');
    expect((input as HTMLInputElement).disabled).toBe(false);
  });

  it('renders no_evidence state with correct copy', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('no_evidence', 'No evidence found for this question.', []);

    const input = screen.getByLabelText('Ask a follow-up question');
    await user.type(input, 'xyzzy not found');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('No relevant evidence found')).toBeDefined();
    });

    expect(screen.getByText(/doesn't appear to contain anything related/)).toBeDefined();
  });

  it('renders off_topic state with distinct copy', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('off_topic', 'This is unrelated.', []);

    const input = screen.getByLabelText('Ask a follow-up question');
    await user.type(input, 'What is the weather?');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('Not related to this repository')).toBeDefined();
    });

    expect(screen.getByText(/browse Explorer \/ Search/)).toBeDefined();
    expect(screen.queryByText('No relevant evidence found')).toBeNull();
  });

  it('renders GenerationFailedState on 502 response', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchFailure(502, 'Generation provider error');

    const input = screen.getByLabelText('Ask a follow-up question');
    await user.type(input, 'Question');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText("Couldn't generate an answer")).toBeDefined();
    });
  });

  it('new conversation clears all turns', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('answered', 'Answer[1].', [1]);

    const input = screen.getByLabelText('Ask a follow-up question');
    await user.type(input, 'First question');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('Answer')).toBeDefined();
    });

    await user.click(screen.getByLabelText('New conversation'));

    expect(screen.queryByText('Answer')).toBeNull();
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('turn independence: a failed turn does not restyle a prior answered turn', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('answered', 'First answer[1].', [1]);
    mockFetchFailure(502, 'Generation provider error');

    const input = screen.getByLabelText('Ask a follow-up question');

    await user.type(input, 'First');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('First answer')).toBeDefined();
    });

    await user.type(input, 'Second');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText("Couldn't generate an answer")).toBeDefined();
    });

    expect(screen.getByText('First answer')).toBeDefined();
    expect(screen.getByText('First')).toBeDefined();
    expect(screen.getByText('Second')).toBeDefined();
  });

  it('submits follow-up with prior history in request body', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('answered', 'First answer[1].', [1]);
    mockFetchSuccess('answered', 'Follow-up answer[1].', [1]);

    const input = screen.getByLabelText('Ask a follow-up question');

    await user.type(input, 'First');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('First answer')).toBeDefined();
    });

    await user.type(input, 'Follow-up');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('Follow-up answer')).toBeDefined();
    });

    const calls = (global.fetch as any).mock.calls;
    const [firstReq, secondReq] = calls;

    const firstBody = JSON.parse(firstReq[1].body);
    expect(firstBody.history).toEqual([]);

    const secondBody = JSON.parse(secondReq[1].body);
    expect(secondBody.history).toHaveLength(1);
    expect(secondBody.history[0].question).toBe('First');
    expect(secondBody.history[0].answer).toBe('First answer[1].');
    expect(secondBody.history[0].citations).toHaveLength(1);
  });

  it('turn independence: a no_evidence turn does not restyle a prior answered turn', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('answered', 'First answer[1].', [1]);
    mockFetchSuccess('no_evidence', "Couldn't find anything.", []);

    const input = screen.getByLabelText('Ask a follow-up question');

    await user.type(input, 'First');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('First answer')).toBeDefined();
    });

    await user.type(input, 'Garbage question');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('No relevant evidence found')).toBeDefined();
    });

    expect(screen.getByText('First answer')).toBeDefined();
  });

  it('failed turn has null answer in history sent to next request', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('answered', 'First answer[1].', [1]);
    mockFetchFailure(502, 'Generation provider error');
    mockFetchSuccess('answered', 'Third answer[1].', [1]);

    const input = screen.getByLabelText('Ask a follow-up question');

    await user.type(input, 'First');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('First answer')).toBeDefined();
    });

    await user.type(input, 'Second');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText("Couldn't generate an answer")).toBeDefined();
    });

    await user.type(input, 'Third');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('Third answer')).toBeDefined();
    });

    const calls = (global.fetch as any).mock.calls;
    const thirdRequestBody = JSON.parse(calls[2][1].body);
    expect(thirdRequestBody.history).toHaveLength(2);
    expect(thirdRequestBody.history[0].question).toBe('First');
    expect(thirdRequestBody.history[0].answer).toBe('First answer[1].');
    expect(thirdRequestBody.history[1].question).toBe('Second');
    expect(thirdRequestBody.history[1].answer).toBe(null);
    expect(thirdRequestBody.history[1].citations).toEqual([]);
  });

  it('announces a successful answer via an aria-live region', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('answered', 'Auth is handled in src/auth/middleware.ts[1].', [1]);

    const input = screen.getByLabelText('Ask a follow-up question');
    await user.type(input, 'Where is authentication handled?');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText(/Auth is handled in/)).toBeDefined();
    });

    const liveRegion = screen.getByText(/Auth is handled in/).closest('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('announces the no-evidence response via an aria-live region', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatClient repoId={REPO_ID} />);

    mockFetchSuccess('no_evidence', 'No evidence found for this question.', []);

    const input = screen.getByLabelText('Ask a follow-up question');
    await user.type(input, 'xyzzy not found');
    await user.click(screen.getByLabelText('Ask'));

    await waitFor(() => {
      expect(screen.getByText('No relevant evidence found')).toBeDefined();
    });

    const liveRegion = screen.getByText('No relevant evidence found').closest('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });
});
