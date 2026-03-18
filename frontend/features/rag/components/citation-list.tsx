"use client";

import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Citation } from "../types/rag";

type Props = {
  citations: Citation[];
};

export function CitationList({ citations }: Props) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5" />
          Citations
        </CardTitle>
        <CardDescription>顯示 snippet、命中方式與 score。</CardDescription>
      </CardHeader>

      <CardContent>
        {!citations.length ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
            目前沒有 citations。
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {citations.map((citation, idx) => (
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
                    <div className="line-clamp-2 text-sm text-slate-700">
                      {citation.snippet}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="space-y-4 pb-4">
                  <div className="flex flex-wrap gap-2">
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

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">完整內容</div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-slate-50 p-4 text-sm leading-7">
                      {citation.full_content}
                    </div>
                  </div>

                  <div className="break-all text-xs text-slate-500">
                    chunk_id: {citation.chunk_id}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}