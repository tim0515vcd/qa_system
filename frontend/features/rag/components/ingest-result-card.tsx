"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">文件處理結果</CardTitle>
        <CardDescription>顯示 upload / ingest / chunks。</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {!uploadResult && !ingestResult && (
          <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
            還沒有文件處理結果。
          </div>
        )}

        {uploadResult && (
          <div className="space-y-2 rounded-xl border bg-white p-4 text-sm">
            <div className="font-medium">Upload</div>
            <div>document_id: {uploadResult.document_id}</div>
            <div>title: {uploadResult.title}</div>
            <div>source_type: {uploadResult.source_type}</div>
            <div>status: {uploadResult.status}</div>
          </div>
        )}

        {ingestResult && (
          <div className="space-y-2 rounded-xl border bg-white p-4 text-sm">
            <div className="font-medium">Ingest</div>
            <div>document_id: {ingestResult.document_id}</div>
            <div>chunks_created: {ingestResult.chunks_created}</div>
            <div>status: {ingestResult.status}</div>
          </div>
        )}

        {chunksResult && (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              Chunks（共 {chunksResult.total} 筆）
            </div>

            <div className="space-y-3">
              {chunksResult.items.map((chunk) => (
                <div key={chunk.id} className="rounded-xl border bg-white p-4">
                  <div className="mb-2 text-xs text-slate-500">
                    chunk #{chunk.chunk_index}
                    {typeof chunk.token_count === "number"
                      ? ` · token_count ${chunk.token_count}`
                      : ""}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7">
                    {chunk.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}