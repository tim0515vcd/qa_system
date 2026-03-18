"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { QAResponse } from "../types/rag";

type Props = {
  loading: boolean;
  error: string | null;
  result: QAResponse | null;
};

export function AnswerCard({ loading, error, result }: Props) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">回答結果</CardTitle>
        <CardDescription>顯示 answer 與 citations。</CardDescription>
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
              <div className="rounded-xl border bg-white p-4 text-sm leading-7">
                {result.query}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-slate-500">Answer</div>
              <div className="whitespace-pre-wrap rounded-xl border bg-white p-4 leading-7">
                {result.answer}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}