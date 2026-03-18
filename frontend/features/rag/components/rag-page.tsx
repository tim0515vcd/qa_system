"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { env } from "@/lib/env";
import { DEFAULT_LIMIT, DEFAULT_QUERY } from "../constants/rag";
import { useDocumentIngest } from "../hooks/use-document-ingest";
import { useRagQa } from "../hooks/use-rag-qa";
import type { FeedbackReason, FeedbackType } from "../types/rag";
import { AnswerCard } from "./answer-card";
import { CitationList } from "./citation-list";
import { FeedbackCard } from "./feedback-card";
import { IngestResultCard } from "./ingest-result-card";
import { QaFormCard } from "./qa-form-card";
import { UploadCard } from "./upload-card";

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

  const {
    uploading,
    ingesting,
    error: documentError,
    message: documentMessage,
    uploadResult,
    ingestResult,
    chunksResult,
    runUploadAndIngest,
  } = useDocumentIngest({ apiBase });

  const handleAsk = () => {
    runAsk(query, Number(limit));
  };

  const handleFeedback = (type: FeedbackType) => {
    runFeedback(type, feedbackReason, feedbackComment);
  };

  const handleUploadAndIngest = (file: File) => {
    runUploadAndIngest(file, "markdown");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-3xl font-semibold tracking-tight">RAG Console</h1>
          <p className="mt-1 text-sm text-slate-500">
            將文件處理與問答操作拆開。
          </p>
        </motion.div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="upload">文件上傳</TabsTrigger>
            <TabsTrigger value="qa">問答查詢</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
              <div className="space-y-6">
                <UploadCard
                  uploading={uploading}
                  ingesting={ingesting}
                  message={documentMessage}
                  error={documentError}
                  onSubmit={handleUploadAndIngest}
                />
              </div>

              <div className="space-y-6">
                <IngestResultCard
                  uploadResult={uploadResult}
                  ingestResult={ingestResult}
                  chunksResult={chunksResult}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qa">
            <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
              <div className="space-y-6">
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
              </div>

              <div className="space-y-6">
                <AnswerCard loading={loading} error={error} result={result} />
                <CitationList citations={result?.citations ?? []} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}