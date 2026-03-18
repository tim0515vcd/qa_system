"use client";

import { useCallback, useState } from "react";
import {
  getDocumentChunks,
  ingestDocument,
  uploadDocument,
} from "../api/document-api";
import type {
  DocumentChunkListResponse,
  IngestDocumentResponse,
  UploadDocumentResponse,
} from "../types/document";

type UseDocumentIngestParams = {
  apiBase: string;
};

export function useDocumentIngest({ apiBase }: UseDocumentIngestParams) {
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [chunkLoading, setChunkLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [uploadResult, setUploadResult] =
    useState<UploadDocumentResponse | null>(null);
  const [ingestResult, setIngestResult] =
    useState<IngestDocumentResponse | null>(null);
  const [chunksResult, setChunksResult] =
    useState<DocumentChunkListResponse | null>(null);

  const runUpload = useCallback(
    async (file: File, sourceType: "markdown" | "pdf" | "notion") => {
      setUploading(true);
      setError(null);
      setMessage("上傳中...");
      setIngestResult(null);
      setChunksResult(null);

      try {
        const data = await uploadDocument(apiBase, { file, sourceType });
        setUploadResult(data);
        setMessage("上傳完成");
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "上傳失敗");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [apiBase],
  );

  const runIngest = useCallback(
    async (documentId: string) => {
      setIngesting(true);
      setError(null);
      setMessage("ingest 中...");

      try {
        const data = await ingestDocument(apiBase, documentId);
        setIngestResult(data);
        setMessage("ingest 完成");
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "ingest 失敗");
        return null;
      } finally {
        setIngesting(false);
      }
    },
    [apiBase],
  );

  const runFetchChunks = useCallback(
    async (documentId: string) => {
      setChunkLoading(true);
      setError(null);

      try {
        const data = await getDocumentChunks(apiBase, documentId);
        setChunksResult(data);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "讀取 chunks 失敗");
        return null;
      } finally {
        setChunkLoading(false);
      }
    },
    [apiBase],
  );

  const runUploadAndIngest = useCallback(
    async (file: File, sourceType: "markdown" | "pdf" | "notion") => {
      const uploaded = await runUpload(file, sourceType);
      if (!uploaded) return;

      const ingested = await runIngest(uploaded.document_id);
      if (!ingested) return;

      await runFetchChunks(uploaded.document_id);
    },
    [runUpload, runIngest, runFetchChunks],
  );

  return {
    uploading,
    ingesting,
    chunkLoading,
    error,
    message,
    uploadResult,
    ingestResult,
    chunksResult,
    runUpload,
    runIngest,
    runFetchChunks,
    runUploadAndIngest,
  };
}