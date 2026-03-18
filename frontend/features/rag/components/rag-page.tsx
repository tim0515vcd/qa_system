"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { env } from "@/lib/env";
import { DEFAULT_LIMIT, DEFAULT_QUERY } from "../constants/rag";
import { useRagQa } from "../hooks/use-rag-qa";
import type { FeedbackReason, FeedbackType } from "../types/rag";
import { AnswerCard } from "./answer-card";
import { CitationList } from "./citation-list";
import { FeedbackCard } from "./feedback-card";
import { QaFormCard } from "./qa-form-card";

export function RagPage() {
  const [apiBase, setApiBase] = useState(env.NEXT_PUBLIC_API_BASE);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [limit, setLimit] = useState(String(DEFAULT_LIMIT));
  const [feedbackReason, setFeedbackReason] =
    useState<FeedbackReason>("relevant");
  const [feedbackComment, setFeedbackComment] = useState("");

  const {
    loading,
    error,
    result,
    feedbackLoading,
    feedbackMessage,
    runAsk,
    runFeedback,
  } = useRagQa({ apiBase });

  const handleAsk = () => {
    runAsk(query, Number(limit));
  };

  const handleFeedback = (type: FeedbackType) => {
    runFeedback(type, feedbackReason, feedbackComment);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <QaFormCard
            apiBase={apiBase}
            query={query}
            limit={limit}
            loading={loading}
            onApiBaseChange={setApiBase}
            onQueryChange={setQuery}
            onLimitChange={setLimit}
            onSubmit={handleAsk}
          />

          <FeedbackCard
            searchQueryId={result?.search_query_id}
            feedbackReason={feedbackReason}
            feedbackComment={feedbackComment}
            feedbackLoading={feedbackLoading}
            feedbackMessage={feedbackMessage}
            onReasonChange={setFeedbackReason}
            onCommentChange={setFeedbackComment}
            onSubmit={handleFeedback}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <AnswerCard loading={loading} error={error} result={result} />
          <CitationList citations={result?.citations ?? []} />
        </motion.div>
      </div>
    </div>
  );
}