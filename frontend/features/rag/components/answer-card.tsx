"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  MessageSquareQuote,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ChatMessage, FeedbackType, Citation } from "../types/rag";
import { MarkdownAnswer } from "./markdown-answer";

type Props = {
  messages: ChatMessage[];
  feedbackLoading: FeedbackType | null;
  feedbackMessage: string | null;
  onSubmitFeedback: (searchQueryId: string, type: FeedbackType) => void;
};

export function AnswerCard({
  messages,
  feedbackLoading,
  feedbackMessage,
  onSubmitFeedback,
}: Props) {
  const t = useTranslations("Answer");

  if (!messages.length) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-260px)] w-full max-w-4xl items-center justify-center px-4 py-8 md:px-6">
        <div className="max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <MessageSquareQuote className="h-6 w-6" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            {t("startTitle")}
          </h2>

          <p className="mt-2 text-sm leading-7 text-slate-500">
            {t("startDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      {messages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AssistantMessage
            key={message.id}
            message={message}
            feedbackLoading={feedbackLoading}
            feedbackMessage={feedbackMessage}
            onSubmitFeedback={onSubmitFeedback}
          />
        ),
      )}
    </div>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-3xl rounded-br-md bg-slate-900 px-5 py-4 text-sm leading-7 text-white shadow-sm">
        {message.query}
      </div>
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
  feedbackLoading: FeedbackType | null;
  feedbackMessage: string | null;
  onSubmitFeedback: (searchQueryId: string, type: FeedbackType) => void;
}) {
  const t = useTranslations("Answer");
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const citationCount = message.citations?.length ?? 0;

  const topCitationPreview = useMemo(() => {
    return (message.citations ?? []).slice(0, 3);
  }, [message.citations]);

  async function handleCopyAnswer() {
    if (!message.answer) return;
    try {
      await navigator.clipboard.writeText(message.answer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex justify-start">
      <div className="w-full rounded-[28px] rounded-bl-md border bg-white px-5 py-5 shadow-sm">
        {message.loading && (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        )}

        {message.error && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-sm leading-7">{message.error}</div>
          </div>
        )}

        {!!message.answer && (
          <>
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50/70 px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                {t("answerLabel")}
              </div>

              <div className="px-1">
                <MarkdownAnswer content={message.answer} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
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
                {t("showSources")}
                <Badge variant="secondary" className="ml-2">
                  {citationCount}
                </Badge>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={handleCopyAnswer}
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? t("copied") : t("copyAnswer")}
              </Button>

              {message.search_query_id && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    disabled={feedbackLoading !== null}
                    onClick={() => onSubmitFeedback(message.search_query_id!, "like")}
                  >
                    {feedbackLoading === "like" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="mr-2 h-4 w-4" />
                    )}
                    {t("helpful")}
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
                    {t("needsImprovement")}
                  </Button>
                </>
              )}
            </div>

            {feedbackMessage && (
              <div className="mt-3 text-sm text-slate-500">{feedbackMessage}</div>
            )}

            {showCitations && !!topCitationPreview.length && (
              <div className="mt-5 rounded-2xl border bg-slate-50/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {t("sourceSummaryTitle")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t("sourceSummaryDescription")}
                    </div>
                  </div>

                  <Badge variant="outline">
                    {t("sourcesCount", { count: citationCount })}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {topCitationPreview.map((citation, idx) => (
                    <CitationPreviewItem
                      key={citation.chunk_id}
                      citation={citation}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            )}

            {showCitations && (
              <>
                <Separator className="my-5" />

                <div className="space-y-3">
                  {!message.citations?.length ? (
                    <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
                      {t("noCitations")}
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

function CitationPreviewItem({
  citation,
  index,
}: {
  citation: Citation;
  index: number;
}) {
  const t = useTranslations("Answer");

  return (
    <div className="rounded-2xl border bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">#{index + 1}</Badge>
        <Badge variant="secondary">{citation.document_title}</Badge>
        <Badge variant="outline">
          {t("chunkLabel", { index: citation.chunk_index })}
        </Badge>
        <Badge variant="secondary">
          {t("scoreLabel", { score: citation.hybrid_score.toFixed(4) })}
        </Badge>
      </div>

      <div className="mt-3 text-sm leading-7 text-slate-700">{citation.snippet}</div>
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
  const t = useTranslations("Answer");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">#{index + 1}</Badge>
        <Badge variant="secondary">{citation.document_title}</Badge>
        <Badge variant="outline">
          {t("chunkLabel", { index: citation.chunk_index })}
        </Badge>
        <Badge variant="secondary">
          {t("scoreLabel", { score: citation.hybrid_score.toFixed(4) })}
        </Badge>
      </div>

      <div className="mt-3 text-sm leading-7 text-slate-700">{citation.snippet}</div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={citation.matched_by_fts ? "default" : "outline"}>
          FTS {citation.matched_by_fts ? t("matched") : t("notMatched")}
        </Badge>
        <Badge variant={citation.matched_by_vector ? "default" : "outline"}>
          Vector {citation.matched_by_vector ? t("matched") : t("notMatched")}
        </Badge>
      </div>

      <button
        type="button"
        className="mt-3 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <>
            {t("collapseFullContent")}
            <ChevronUp className="ml-1 h-4 w-4" />
          </>
        ) : (
          <>
            {t("expandFullContent")}
            <ChevronDown className="ml-1 h-4 w-4" />
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-3 rounded-xl border bg-white p-4 text-sm leading-7 text-slate-700">
          <div className="whitespace-pre-wrap">{citation.full_content}</div>
          <div className="mt-3 break-all text-xs text-slate-400">
            {t("chunkIdLabel")}: {citation.chunk_id}
          </div>
        </div>
      )}
    </div>
  );
}