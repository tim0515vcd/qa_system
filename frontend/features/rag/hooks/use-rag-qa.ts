"use client";

import { useCallback, useRef, useState } from "react";
import { askQuestion, submitFeedback } from "../api/rag-api";
import type {
  ChatMessage,
  FeedbackReason,
  FeedbackType,
  QAResponse,
} from "../types/rag";

type UseRagQaParams = {
  apiBase: string;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useRagQa({ apiBase }: UseRagQaParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [feedbackLoading, setFeedbackLoading] =
    useState<FeedbackType | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const runAsk = useCallback(
    async (query: string, limit: number) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userId = createMessageId();
      const assistantId = createMessageId();

      setLoading(true);
      setError(null);
      setFeedbackMessage(null);

      setMessages((prev) => [
        ...prev,
        {
          id: userId,
          role: "user",
          query: trimmed,
        },
        {
          id: assistantId,
          role: "assistant",
          loading: true,
        },
      ]);

      try {
        const data: QAResponse = await askQuestion(
          apiBase,
          { query: trimmed, limit },
          controller.signal,
        );

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  id: assistantId,
                  role: "assistant",
                  answer: data.answer,
                  citations: data.citations,
                  search_query_id: data.search_query_id,
                  loading: false,
                }
              : message,
          ),
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        const message = err instanceof Error ? err.message : "發生未知錯誤";

        setError(message);
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantId
              ? {
                  id: assistantId,
                  role: "assistant",
                  error: message,
                  loading: false,
                }
              : item,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [apiBase],
  );

  const runFeedback = useCallback(
    async (
      searchQueryId: string,
      feedbackType: FeedbackType,
      reason: FeedbackReason,
      comment: string,
    ) => {
      if (!searchQueryId) return;

      setFeedbackLoading(feedbackType);
      setFeedbackMessage(null);

      try {
        await submitFeedback(apiBase, searchQueryId, {
          feedback_type: feedbackType,
          reason,
          comment: comment.trim() || null,
        });

        setFeedbackMessage(
          feedbackType === "like"
            ? "已送出 like feedback"
            : "已送出 dislike feedback",
        );
      } catch (err) {
        setFeedbackMessage(
          err instanceof Error ? err.message : "feedback 送出失敗",
        );
      } finally {
        setFeedbackLoading(null);
      }
    },
    [apiBase],
  );

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setFeedbackMessage(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    messages,
    feedbackLoading,
    feedbackMessage,
    runAsk,
    runFeedback,
    clearMessages,
  };
}