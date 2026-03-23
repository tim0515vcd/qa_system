"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, FileText, Layers3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const chunkPreviewItems = useMemo(() => chunksResult?.items ?? [], [chunksResult]);

  function toggleChunk(id: string) {
    setExpandedChunkIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  return (
    <Card className="w-full rounded-3xl border shadow-sm">
      <CardHeader className="space-y-2 pb-4">
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

        {(uploadResult || ingestResult) && (
          <div className="grid gap-4">
            {uploadResult && (
              <section className="rounded-[24px] border bg-white p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {t("sections.upload")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t("uploadDescription")}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoStat label={t("fields.title")} value={uploadResult.title} />
                  <InfoStat
                    label={t("fields.sourceType")}
                    value={uploadResult.source_type}
                  />
                  <InfoStat
                    label={t("fields.status")}
                    value={uploadResult.status}
                  />
                  <InfoStat
                    label={t("fields.documentId")}
                    value={uploadResult.document_id}
                    mono
                  />
                </div>
              </section>
            )}

            {ingestResult && (
              <section className="rounded-[24px] border bg-white p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Layers3 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {t("sections.ingest")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t("ingestDescription")}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoStat
                    label={t("fields.documentId")}
                    value={ingestResult.document_id}
                    mono
                  />
                  <InfoStat
                    label={t("fields.chunksCreated")}
                    value={String(ingestResult.chunks_created)}
                  />
                  <InfoStat
                    label={t("fields.status")}
                    value={ingestResult.status}
                  />
                </div>
              </section>
            )}
          </div>
        )}

        {chunksResult && (
          <section className="rounded-[24px] border bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {t("sections.chunks", { total: chunkPreviewItems.length })}
                </div>
                <div className="text-xs text-slate-500">
                  {t("chunksDescription")}
                </div>
              </div>

              <Badge variant="outline">{chunkPreviewItems.length}</Badge>
            </div>

            <div className="space-y-3">
              {chunkPreviewItems.map((chunk) => {
                const expanded = expandedChunkIds.includes(chunk.id);

                return (
                  <div key={chunk.id} className="rounded-2xl border bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {t("chunkLabel", { index: chunk.chunk_index })}
                        </Badge>

                        {typeof chunk.token_count === "number" && (
                          <Badge variant="outline">
                            {t("tokenCount", { count: chunk.token_count })}
                          </Badge>
                        )}

                        {chunk.chunk_type && (
                          <Badge variant="outline">
                            {t("typeLabel", { value: chunk.chunk_type })}
                          </Badge>
                        )}

                        {chunk.content_language && (
                          <Badge variant="outline">
                            {t("langLabel", { value: chunk.content_language })}
                          </Badge>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => toggleChunk(chunk.id)}
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            {t("collapseChunk")}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            {t("expandChunk")}
                          </>
                        )}
                      </Button>
                    </div>

                    {expanded && (
                      <div className="mt-3 rounded-xl border bg-white p-4 text-sm leading-7 text-slate-700">
                        <div className="whitespace-pre-wrap">{chunk.content}</div>
                        <div className="mt-3 break-all text-xs text-slate-400">
                          {chunk.id}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}

function InfoStat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50/70 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={[
          "mt-2 text-sm text-slate-900",
          mono ? "break-all font-mono" : "",
        ].join(" ")}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}