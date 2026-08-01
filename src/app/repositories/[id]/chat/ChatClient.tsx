'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChatCitation } from '@/lib/chat';
import UserQuestion from '@/components/chat/UserQuestion';
import AnswerCard from '@/components/chat/AnswerCard';
import GeneratingState from '@/components/chat/GeneratingState';
import NoEvidenceState from '@/components/chat/NoEvidenceState';
import GenerationFailedState from '@/components/chat/GenerationFailedState';
import ChatInput from '@/components/chat/ChatInput';
import NewConversationButton from '@/components/chat/NewConversationButton';

type Turn = {
  id: string;
  status: 'generating' | 'answered' | 'no_evidence' | 'off_topic' | 'failed';
  question: string;
  answer: string | null;
  citations: ChatCitation[];
};

type Props = {
  repoId: string;
};

export default function ChatClient({ repoId }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;

  const newConversation = useCallback(() => {
    setTurns([]);
    setInputValue('');
    setIsSubmitting(false);
    submittingRef.current = false;
  }, []);

  const submitQuestion = useCallback(async () => {
    if (!inputValue.trim() || submittingRef.current) {
      return;
    }

    const question = inputValue.trim();
    setInputValue('');
    setIsSubmitting(true);
    submittingRef.current = true;

    const newTurnId = crypto.randomUUID();
    const newTurn: Turn = {
      id: newTurnId,
      status: 'generating',
      question,
      answer: null,
      citations: [],
    };

    setTurns((prev) => [...prev, newTurn]);

    try {
      const history = turnsRef.current
        .filter((t) => t.status !== 'generating')
        .map((t) => ({
          question: t.question,
          answer: t.status === 'failed' ? null : t.answer,
          citations: t.status === 'failed' ? [] : t.citations,
        }));

      const res = await fetch(`/api/repositories/${repoId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });

      if (!res.ok) {
        let errorMessage = `Request failed (${res.status})`;
        try {
          const errorBody = await res.json();
          if (errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          // keep default error message
        }

        setTurns((prev) =>
          prev.map((t) =>
            t.id === newTurnId
              ? { ...t, status: 'failed', answer: errorMessage, citations: [] }
              : t
          )
        );
        return;
      }

      const data = await res.json();

      if (data.status === 'answered') {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === newTurnId
              ? { ...t, status: 'answered', answer: data.answer, citations: data.citations || [] }
              : t
          )
        );
      } else if (data.status === 'no_evidence') {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === newTurnId
              ? { ...t, status: 'no_evidence', answer: data.answer || '', citations: [] }
              : t
          )
        );
      } else if (data.status === 'off_topic') {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === newTurnId
              ? { ...t, status: 'off_topic', answer: data.answer || '', citations: [] }
              : t
          )
        );
      } else {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === newTurnId
              ? { ...t, status: 'failed', answer: 'Unexpected response', citations: [] }
              : t
          )
        );
      }
    } catch {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === newTurnId
            ? { ...t, status: 'failed', answer: 'Network error. Please try again.', citations: [] }
            : t
        )
      );
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [inputValue, repoId]);

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Chat</h1>
        <NewConversationButton onClick={newConversation} disabled={isSubmitting} />
      </div>

      <div className="space-y-6">
        {turns.map((turn) => (
          <div key={turn.id} className="space-y-1">
            <UserQuestion question={turn.question} />
            <div aria-live="polite" aria-atomic="true">
              {turn.status === 'generating' && <GeneratingState />}
              {turn.status === 'answered' && (
                <AnswerCard answer={turn.answer || ''} citations={turn.citations} repoId={repoId} />
              )}
              {turn.status === 'no_evidence' && (
                <NoEvidenceState
                  heading="No relevant evidence found"
                  subtext="This repository doesn't appear to contain anything related to that question — try rephrasing, or browse Explorer / Search instead."
                />
              )}
              {turn.status === 'off_topic' && (
                <NoEvidenceState
                  heading="Not related to this repository"
                  subtext="Try asking something about the codebase itself, or browse Explorer / Search instead."
                />
              )}
              {turn.status === 'failed' && <GenerationFailedState />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={submitQuestion}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
}
