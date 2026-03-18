"use client";

import { useCallback, useRef, useState } from "react";
import { askQuestion, submitFeedback } from "../api/rag-api";
import type {
  FeedbackReason,
  FeedbackType,
  QAResponse,
} from "../types/rag";

type UseRagQaParams = {
  apiBase: string;
};

export function useRagQa({ apiBase }: UseRagQaParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<QAResponse | null>(null);

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

      setLoading(true);
      setError(null);
      setFeedbackMessage(null);

      try {
        const data = await askQuestion(
          apiBase,
          { query: trimmed, limit },
          controller.signal,
        );
        setResult(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "發生未知錯誤");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [apiBase],
  );

  const runFeedback = useCallback(
    async (
      feedbackType: FeedbackType,
      reason: FeedbackReason,
      comment: string,
    ) => {
      if (!result?.search_query_id) return;

      setFeedbackLoading(feedbackType);
      setFeedbackMessage(null);

      try {
        await submitFeedback(apiBase, result.search_query_id, {
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
    [apiBase, result?.search_query_id],
  );

  return {
    loading,
    error,
    result,
    feedbackLoading,
    feedbackMessage,
    runAsk,
    runFeedback,
  };
}