"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import {LocaleSwitcher} from "@/components/locale-switcher";
import { DEFAULT_LIMIT, DEFAULT_QUERY } from "../constants/rag";
import { useDocumentIngest } from "../hooks/use-document-ingest";
import { useRagQa } from "../hooks/use-rag-qa";
import type { FeedbackReason, FeedbackType } from "../types/rag";
import { AnswerCard } from "./answer-card";
import { IngestResultCard } from "./ingest-result-card";
import { QaFormCard } from "./qa-form-card";
import { UploadCard } from "./upload-card";

export function RagPage() {
  const t = useTranslations("RagPage");
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
    chunkLoading,
    error: documentError,
    message: documentMessage,
    queue,
    selectedQueueId,
    selectedItem,
    setSelectedQueueId,
    runBatchUploadAndIngest,
    clearQueue,
  } = useDocumentIngest({ apiBase });

  const handleUploadAndIngest = async (files: File[]) => {
    await runBatchUploadAndIngest(files, "markdown");
  };

  const handleAsk = async () => {
    const currentQuery = query;
    await runAsk(currentQuery, Number(limit));
    setQuery("");
  };

  const handleFeedback = (searchQueryId: string, type: FeedbackType) => {
    runFeedback(searchQueryId, type, feedbackReason, feedbackComment);
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
          <div className="relative">
            <div className="text-center">
              <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
              <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
            </div>

            <div className="mt-3 flex justify-center gap-3 sm:absolute sm:right-0 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2">
              <LocaleSwitcher />
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="qa" className="space-y-6">
          <TabsList className="mx-auto grid w-fit grid-cols-2">
            <TabsTrigger value="qa">{t("tabs.qa")}</TabsTrigger>
            <TabsTrigger value="upload">{t("tabs.upload")}</TabsTrigger>
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
                onClear={clearMessages}
                canClear={messages.length > 0}
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
              <UploadCard
                uploading={uploading}
                ingesting={ingesting}
                message={documentMessage}
                error={documentError}
                queue={queue}
                selectedQueueId={selectedQueueId}
                onSelectQueueItem={setSelectedQueueId}
                onSubmit={handleUploadAndIngest}
                onClearQueue={clearQueue}
              />

              <IngestResultCard
                uploadResult={selectedItem?.uploadResult ?? null}
                ingestResult={selectedItem?.ingestResult ?? null}
                chunksResult={selectedItem?.chunksResult ?? null}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}