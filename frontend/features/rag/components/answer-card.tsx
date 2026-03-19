"use client";

import { useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquareQuote,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type {
  ChatMessage,
  FeedbackReason,
  FeedbackType,
  Citation,
} from "../types/rag";
import { MarkdownAnswer } from "./markdown-answer";

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  feedbackReason: FeedbackReason;
  feedbackComment: string;
  feedbackLoading: FeedbackType | null;
  feedbackMessage: string | null;
  onSubmitFeedback: (searchQueryId: string, type: FeedbackType) => void;
};

export function AnswerCard({
  messages,
  loading,
  error,
  feedbackLoading,
  feedbackMessage,
  onSubmitFeedback,
}: Props) {
  if (!messages.length) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-260px)] w-full max-w-4xl items-center justify-center px-4 py-8 md:px-6">
        <div className="max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <MessageSquareQuote className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">開始你的問答</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            在下方輸入問題，我會用已 ingest 的文件進行檢索並產生回答。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-3xl rounded-br-md bg-slate-900 px-5 py-4 text-sm leading-7 text-white shadow-sm">
                {message.query}
              </div>
            </div>
          );
        }

        return (
          <AssistantMessage
            key={message.id}
            message={message}
            loading={loading}
            error={error}
            feedbackLoading={feedbackLoading}
            feedbackMessage={feedbackMessage}
            onSubmitFeedback={onSubmitFeedback}
          />
        );
      })}
    </div>
  );
}

function AssistantMessage({
  message,
  feedbackLoading,
  feedbackMessage,
  onSubmitFeedback,
}: {
  message: ChatMessage;
  loading: boolean;
  error: string | null;
  feedbackLoading: FeedbackType | null;
  feedbackMessage: string | null;
  onSubmitFeedback: (searchQueryId: string, type: FeedbackType) => void;
}) {
  const [showCitations, setShowCitations] = useState(false);

  return (
    <div className="flex justify-start">
      <div className="w-full rounded-3xl rounded-bl-md border bg-white px-5 py-5 shadow-sm">
        {message.loading && (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在查詢並生成回答...
          </div>
        )}

        {message.error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div className="text-sm leading-7">{message.error}</div>
          </div>
        )}

        {!!message.answer && (
          <>
            <MarkdownAnswer content={message.answer} />

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowCitations((prev) => !prev)}
              >
                {showCitations ? (
                  <ChevronUp className="mr-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="mr-2 h-4 w-4" />
                )}
                查看來源
                <Badge variant="secondary" className="ml-2">
                  {message.citations?.length ?? 0}
                </Badge>
              </Button>

              {message.search_query_id && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    disabled={feedbackLoading !== null}
                    onClick={() =>
                      onSubmitFeedback(message.search_query_id!, "like")
                    }
                  >
                    {feedbackLoading === "like" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="mr-2 h-4 w-4" />
                    )}
                    有幫助
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    disabled={feedbackLoading !== null}
                    onClick={() =>
                      onSubmitFeedback(message.search_query_id!, "dislike")
                    }
                  >
                    {feedbackLoading === "dislike" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsDown className="mr-2 h-4 w-4" />
                    )}
                    需要改進
                  </Button>
                </>
              )}
            </div>

            {feedbackMessage && (
              <div className="mt-3 text-sm text-slate-500">{feedbackMessage}</div>
            )}

            {showCitations && (
              <>
                <Separator className="my-5" />

                <div className="space-y-3">
                  {!message.citations?.length ? (
                    <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
                      目前沒有 citations。
                    </div>
                  ) : (
                    message.citations.map((citation, idx) => (
                      <CitationItem
                        key={citation.chunk_id}
                        citation={citation}
                        index={idx}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CitationItem({
  citation,
  index,
}: {
  citation: Citation;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">#{index + 1}</Badge>
        <Badge variant="secondary">{citation.document_title}</Badge>
        <Badge variant="outline">chunk {citation.chunk_index}</Badge>
        <Badge variant={citation.matched_by_fts ? "default" : "outline"}>
          FTS {citation.matched_by_fts ? "命中" : "未命中"}
        </Badge>
        <Badge variant={citation.matched_by_vector ? "default" : "outline"}>
          Vector {citation.matched_by_vector ? "命中" : "未命中"}
        </Badge>
        <Badge variant="secondary">
          score {citation.hybrid_score.toFixed(4)}
        </Badge>
      </div>

      <div className="mt-3 text-sm leading-7 text-slate-700">
        {citation.snippet}
      </div>

      <button
        type="button"
        className="mt-3 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <>
            收起完整內容
            <ChevronUp className="ml-1 h-4 w-4" />
          </>
        ) : (
          <>
            展開完整內容
            <ChevronDown className="ml-1 h-4 w-4" />
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-3 rounded-xl border bg-white p-4 text-sm leading-7 text-slate-700">
          <div className="whitespace-pre-wrap">{citation.full_content}</div>
          <div className="mt-3 break-all text-xs text-slate-400">
            chunk_id: {citation.chunk_id}
          </div>
        </div>
      )}
    </div>
  );
}