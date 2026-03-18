"use client";

import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
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
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Feedback</CardTitle>
        <CardDescription>送出 like / dislike。</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="feedback-reason">Reason</Label>
          <Select
            value={feedbackReason}
            onValueChange={(value) => onReasonChange(value as FeedbackReason)}
          >
            <SelectTrigger id="feedback-reason">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevant">relevant</SelectItem>
              <SelectItem value="not_relevant">not_relevant</SelectItem>
              <SelectItem value="incomplete">incomplete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-comment">Comment</Label>
          <Textarea
            id="feedback-comment"
            value={feedbackComment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="補充說明，可留空!!!!"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            className="rounded-2xl"
            disabled={!searchQueryId || feedbackLoading !== null}
            onClick={() => onSubmit("like")}
          >
            {feedbackLoading === "like" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className="mr-2 h-4 w-4" />
            )}
            Like
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
            Dislike
          </Button>
        </div>

        {searchQueryId && (
          <div className="rounded-xl border bg-white p-3 text-sm">
            <div className="font-medium">目前 search_query_id</div>
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