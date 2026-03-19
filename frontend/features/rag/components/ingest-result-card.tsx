"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  DocumentChunkListResponse,
  IngestDocumentResponse,
  UploadDocumentResponse,
} from "../types/document";

type Props = {
  uploadResult: UploadDocumentResponse | null;
  ingestResult: IngestDocumentResponse | null;
  chunksResult: DocumentChunkListResponse | null;
};

export function IngestResultCard({
  uploadResult,
  ingestResult,
  chunksResult,
}: Props) {
  const t = useTranslations("IngestResult");
  const [expandedChunkIds, setExpandedChunkIds] = useState<string[]>([]);

  function toggleChunk(id: string) {
    setExpandedChunkIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  return (
    <Card className="mx-auto w-full max-w-3xl rounded-3xl border shadow-sm">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-sm leading-7 text-slate-500">
          {t("description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {!uploadResult && !ingestResult && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
            {t("empty")}
          </div>
        )}

        {uploadResult && (
          <div className="space-y-2 rounded-2xl border bg-white p-4 text-sm leading-7">
            <div className="font-medium">{t("sections.upload")}</div>
            <div>
              <span className="font-medium">{t("fields.documentId")}:</span>{" "}
              {uploadResult.document_id}
            </div>
            <div>
              <span className="font-medium">{t("fields.title")}:</span>{" "}
              {uploadResult.title}
            </div>
            <div>
              <span className="font-medium">{t("fields.sourceType")}:</span>{" "}
              {uploadResult.source_type}
            </div>
            <div>
              <span className="font-medium">{t("fields.status")}:</span>{" "}
              {uploadResult.status}
            </div>
          </div>
        )}

        {ingestResult && (
          <div className="space-y-2 rounded-2xl border bg-white p-4 text-sm leading-7">
            <div className="font-medium">{t("sections.ingest")}</div>
            <div>
              <span className="font-medium">{t("fields.documentId")}:</span>{" "}
              {ingestResult.document_id}
            </div>
            <div>
              <span className="font-medium">{t("fields.chunksCreated")}:</span>{" "}
              {ingestResult.chunks_created}
            </div>
            <div>
              <span className="font-medium">{t("fields.status")}:</span>{" "}
              {ingestResult.status}
            </div>
          </div>
        )}

        {chunksResult && (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              {t("sections.chunks", { total: chunksResult.total })}
            </div>

            <div className="space-y-3">
              {chunksResult.items.map((chunk) => {
                const expanded = expandedChunkIds.includes(chunk.id);

                return (
                  <div
                    key={chunk.id}
                    className="rounded-2xl border bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 text-xs text-slate-500">
                          {t("chunkLabel", { index: chunk.chunk_index })}
                          {typeof chunk.token_count === "number"
                            ? ` · ${t("tokenCount", { count: chunk.token_count })}`
                            : ""}
                        </div>

                        <div className="line-clamp-2 text-sm leading-7 text-slate-700">
                          {chunk.content}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 rounded-xl"
                        onClick={() => toggleChunk(chunk.id)}
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="mr-1 h-4 w-4" />
                            {t("collapseChunk")}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1 h-4 w-4" />
                            {t("expandChunk")}
                          </>
                        )}
                      </Button>
                    </div>

                    {expanded && (
                      <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                        <div className="whitespace-pre-wrap">{chunk.content}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}