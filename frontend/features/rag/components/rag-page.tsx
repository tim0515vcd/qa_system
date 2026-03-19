"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { DEFAULT_LIMIT, DEFAULT_QUERY } from "../constants/rag";
import { useDocumentIngest } from "../hooks/use-document-ingest";
import { useRagQa } from "../hooks/use-rag-qa";
import type { FeedbackReason, FeedbackType } from "../types/rag";
import { AnswerCard } from "./answer-card";
import { IngestResultCard } from "./ingest-result-card";
import { QaFormCard } from "./qa-form-card";
import { UploadCard } from "./upload-card";

export function RagPage() {
  const [apiBase, setApiBase] = useState(env.NEXT_PUBLIC_API_BASE);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [limit, setLimit] = useState(String(DEFAULT_LIMIT));
  const [feedbackReason] = useState<FeedbackReason>("relevant");
  const [feedbackComment] = useState("");

  const {
    loading,
    error,
    messages,
    feedbackLoading,
    feedbackMessage,
    runAsk,
    runFeedback,
    clearMessages,
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

  const handleAsk = async () => {
    const currentQuery = query;
    await runAsk(currentQuery, Number(limit));
    setQuery("");
  };

  const handleFeedback = (searchQueryId: string, type: FeedbackType) => {
    runFeedback(searchQueryId, type, feedbackReason, feedbackComment);
  };

  const handleUploadAndIngest = (file: File) => {
    runUploadAndIngest(file, "markdown");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">RAG Console</h1>
              <p className="mt-1 text-sm text-slate-500">
                文件處理與問答操作分開，問答區支援對話堆疊。
              </p>
            </div>

            <Button
              variant="outline"
              className="rounded-xl"
              onClick={clearMessages}
              disabled={!messages.length}
            >
              清除對話
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="qa" className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="qa">問答查詢</TabsTrigger>
            <TabsTrigger value="upload">文件上傳</TabsTrigger>
          </TabsList>

          <TabsContent value="qa" className="mt-0">
            <div className="flex min-h-[calc(100vh-180px)] flex-col">
              <AnswerCard
                messages={messages}
                loading={loading}
                error={error}
                feedbackReason={feedbackReason}
                feedbackComment={feedbackComment}
                feedbackLoading={feedbackLoading}
                feedbackMessage={feedbackMessage}
                onSubmitFeedback={handleFeedback}
              />

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
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
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
        </Tabs>
      </div>
    </div>
  );
}