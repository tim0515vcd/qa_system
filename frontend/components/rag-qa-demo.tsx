"use client";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageSquareText, ThumbsUp, ThumbsDown, FileText, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Citation = {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  document_title: string;
  snippet: string;
  full_content: string;
  matched_by_fts: boolean;
  matched_by_vector: boolean;
  hybrid_score: number;
  created_at: string;
};

type QAResponse = {
  search_query_id: string;
  query: string;
  answer: string;
  citations: Citation[];
};

type FeedbackType = "like" | "dislike";

const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://10.16.43.66:8000";

export default function RagQaFrontendDemo() {
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [query, setQuery] = useState("VPN 怎麼申請？");
  const [limit, setLimit] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QAResponse | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<FeedbackType | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackReason, setFeedbackReason] = useState("relevant");
  const [feedbackComment, setFeedbackComment] = useState("");

  const qaUrl = useMemo(() => `${apiBase.replace(/\/$/, "")}/api/v1/qa/ask`, [apiBase]);
  const feedbackUrlBase = useMemo(() => `${apiBase.replace(/\/$/, "")}/api/v1/search`, [apiBase]);

  async function handleAsk() {
    setLoading(true);
    setError(null);
    setFeedbackMessage(null);

    try {
      const resp = await fetch(qaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: Number(limit),
        }),
      });

      if (!resp.ok) {
        const detail = await safeError(resp);
        throw new Error(detail || `QA request failed: ${resp.status}`);
      }

      const data: QAResponse = await resp.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback(feedbackType: FeedbackType) {
    if (!result?.search_query_id) return;

    setFeedbackLoading(feedbackType);
    setFeedbackMessage(null);

    try {
      const resp = await fetch(`${feedbackUrlBase}/${result.search_query_id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback_type: feedbackType,
          reason: feedbackReason,
          comment: feedbackComment || null,
        }),
      });

      if (!resp.ok) {
        const detail = await safeError(resp);
        throw new Error(detail || `Feedback request failed: ${resp.status}`);
      }

      setFeedbackMessage(feedbackType === "like" ? "已送出 like feedback" : "已送出 dislike feedback");
    } catch (err) {
      setFeedbackMessage(err instanceof Error ? err.message : "feedback 送出失敗");
    } finally {
      setFeedbackLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageSquareText className="h-5 w-5" />
                RAG QA Demo
              </CardTitle>
              <CardDescription>
                輸入問題後，前端會呼叫你的 <code>/api/v1/qa/ask</code>，並顯示 answer、citations 與 feedback。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="api-base">API Base URL</Label>
                <Input
                  id="api-base"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder="http://localhost:8000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="query">問題</Label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="例如：VPN 怎麼申請？"
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Citation 數量</Label>
                <Select value={limit} onValueChange={setLimit}>
                  <SelectTrigger id="limit">
                    <SelectValue placeholder="選擇數量" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full rounded-2xl" onClick={handleAsk} disabled={loading || !query.trim()}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                送出 QA 查詢
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Feedback</CardTitle>
              <CardDescription>用目前這次 search_query_id 送 like / dislike。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback-reason">Reason</Label>
                <Input
                  id="feedback-reason"
                  value={feedbackReason}
                  onChange={(e) => setFeedbackReason(e.target.value)}
                  placeholder="relevant / not_relevant / incomplete"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-comment">Comment</Label>
                <Textarea
                  id="feedback-comment"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="補充說明，可留空"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  disabled={!result?.search_query_id || feedbackLoading !== null}
                  onClick={() => submitFeedback("like")}
                >
                  {feedbackLoading === "like" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
                  Like
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  disabled={!result?.search_query_id || feedbackLoading !== null}
                  onClick={() => submitFeedback("dislike")}
                >
                  {feedbackLoading === "dislike" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
                  Dislike
                </Button>
              </div>

              {result?.search_query_id && (
                <div className="rounded-xl border bg-white p-3 text-sm">
                  <div className="font-medium">目前 search_query_id</div>
                  <div className="mt-1 break-all text-slate-600">{result.search_query_id}</div>
                </div>
              )}

              {feedbackMessage && <div className="text-sm text-slate-600">{feedbackMessage}</div>}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">回答結果</CardTitle>
              <CardDescription>這裡會顯示你的 QA API 回傳的 answer 與 citations。</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在呼叫 QA API...
                </div>
              )}

              {!loading && error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <div className="text-sm">{error}</div>
                </div>
              )}

              {!loading && !error && !result && (
                <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
                  還沒有查詢結果，先送出一個問題。
                </div>
              )}

              {!loading && !error && result && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="text-sm text-slate-500">問題</div>
                    <div className="rounded-xl border bg-white p-4 text-sm leading-7">{result.query}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-slate-500">Answer</div>
                    <div className="rounded-xl border bg-white p-4 whitespace-pre-wrap leading-7">{result.answer}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Citations
              </CardTitle>
              <CardDescription>保留 snippet、完整內容、命中方式與 hybrid score。</CardDescription>
            </CardHeader>
            <CardContent>
              {!result?.citations?.length ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">目前沒有 citations。</div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {result.citations.map((citation, idx) => (
                    <AccordionItem
                      key={citation.chunk_id}
                      value={citation.chunk_id}
                      className="overflow-hidden rounded-2xl border bg-white px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 pr-4 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">#{idx + 1}</Badge>
                            <Badge variant="secondary">{citation.document_title}</Badge>
                            <Badge variant="outline">chunk {citation.chunk_index}</Badge>
                          </div>
                          <div className="line-clamp-2 text-sm text-slate-700">{citation.snippet}</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pb-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={citation.matched_by_fts ? "default" : "outline"}>FTS {citation.matched_by_fts ? "命中" : "未命中"}</Badge>
                          <Badge variant={citation.matched_by_vector ? "default" : "outline"}>Vector {citation.matched_by_vector ? "命中" : "未命中"}</Badge>
                          <Badge variant="secondary">score {citation.hybrid_score.toFixed(4)}</Badge>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="text-sm font-medium">完整內容</div>
                          <div className="rounded-xl border bg-slate-50 p-4 whitespace-pre-wrap text-sm leading-7">
                            {citation.full_content}
                          </div>
                        </div>

                        <div className="text-xs text-slate-500 break-all">
                          chunk_id: {citation.chunk_id}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

async function safeError(resp: Response): Promise<string | null> {
  try {
    const data = await resp.json();
    if (typeof data?.detail === "string") return data.detail;
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

