"use client";

import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeedbackReason, FeedbackType } from "../types/rag";

type Props = {
  searchQueryId?: string;
  feedbackReason: FeedbackReason;
  feedbackComment: string;
  feedbackLoading: FeedbackType | null;
  feedbackMessage: string | null;
  onReasonChange: (value: FeedbackReason) => void;
  onCommentChange: (value: string) => void;
  onSubmit: (type: FeedbackType) => void;
};

export function FeedbackCard({
  searchQueryId,
  feedbackReason,
  feedbackComment,
  feedbackLoading,
  feedbackMessage,
  onReasonChange,
  onCommentChange,
  onSubmit,
}: Props) {
  const t = useTranslations("Feedback");

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="feedback-reason">{t("reason")}</Label>
          <Select
            value={feedbackReason}
            onValueChange={(value) => onReasonChange(value as FeedbackReason)}
          >
            <SelectTrigger id="feedback-reason">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevant">{t("reasons.relevant")}</SelectItem>
              <SelectItem value="not_relevant">{t("reasons.notRelevant")}</SelectItem>
              <SelectItem value="incomplete">{t("reasons.incomplete")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-comment">{t("comment")}</Label>
          <Textarea
            id="feedback-comment"
            value={feedbackComment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder={t("commentPlaceholder")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            className="rounded-2xl bg-sky-50"
            disabled={!searchQueryId || feedbackLoading !== null}
            onClick={() => onSubmit("like")}
          >
            {feedbackLoading === "like" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className="mr-2 h-4 w-4" />
            )}
            {t("like")}
          </Button>

          <Button
            variant="secondary"
            className="rounded-2xl"
            disabled={!searchQueryId || feedbackLoading !== null}
            onClick={() => onSubmit("dislike")}
          >
            {feedbackLoading === "dislike" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ThumbsDown className="mr-2 h-4 w-4" />
            )}
            {t("dislike")}
          </Button>
        </div>

        {searchQueryId && (
          <div className="rounded-xl border bg-white p-3 text-sm">
            <div className="font-medium">{t("searchQueryId")}</div>
            <div className="mt-1 break-all text-slate-600">{searchQueryId}</div>
          </div>
        )}

        {feedbackMessage && (
          <div className="text-sm text-slate-600">{feedbackMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}