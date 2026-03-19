"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getDocumentChunks,
  ingestDocument,
  uploadDocument,
} from "../api/document-api";
import type {
  DocumentChunkListResponse,
  IngestDocumentResponse,
  UploadDocumentResponse,
  UploadQueueItem,
} from "../types/document";

type UseDocumentIngestParams = {
  apiBase: string;
};

function createQueueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useDocumentIngest({ apiBase }: UseDocumentIngestParams) {
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [chunkLoading, setChunkLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  const runUpload = useCallback(
    async (file: File, sourceType: "markdown" | "pdf" | "notion") => {
      return uploadDocument(apiBase, { file, sourceType });
    },
    [apiBase],
  );

  const runIngest = useCallback(
    async (documentId: string) => {
      return ingestDocument(apiBase, documentId);
    },
    [apiBase],
  );

  const runFetchChunks = useCallback(
    async (documentId: string) => {
      setChunkLoading(true);
      try {
        return await getDocumentChunks(apiBase, documentId);
      } finally {
        setChunkLoading(false);
      }
    },
    [apiBase],
  );

  const runBatchUploadAndIngest = useCallback(
    async (files: File[], sourceType: "markdown" | "pdf" | "notion") => {
      if (!files.length) return;

      setError(null);
      setMessage(`開始處理 ${files.length} 個檔案`);

      const initialQueue: UploadQueueItem[] = files.map((file) => ({
        id: createQueueId(),
        fileName: file.name,
        status: "idle",
        error: null,
        uploadResult: null,
        ingestResult: null,
        chunksResult: null,
      }));

      setQueue(initialQueue);
      setSelectedQueueId(initialQueue[0]?.id ?? null);

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const queueId = initialQueue[i].id;

        try {
          setUploading(true);
          setIngesting(false);
          setSelectedQueueId(queueId);

          setQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? { ...item, status: "uploading", error: null }
                : item,
            ),
          );

          setMessage(`上傳中：${file.name}`);
          const uploaded = await runUpload(file, sourceType);

          setQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    status: "ingesting",
                    uploadResult: uploaded,
                  }
                : item,
            ),
          );

          setIngesting(true);
          setMessage(`ingest 中：${file.name}`);
          const ingested = await runIngest(uploaded.document_id);

          const chunks = await runFetchChunks(uploaded.document_id);

          setQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    status: "success",
                    uploadResult: uploaded,
                    ingestResult: ingested,
                    chunksResult: chunks,
                  }
                : item,
            ),
          );

          setMessage(`完成：${file.name}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "處理失敗";

          setQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    status: "error",
                    error: msg,
                  }
                : item,
            ),
          );

          setError(msg);
        } finally {
          setUploading(false);
          setIngesting(false);
        }
      }

      setMessage("多檔案處理完成");
    },
    [runFetchChunks, runIngest, runUpload],
  );

  const selectedItem = useMemo(
    () => queue.find((item) => item.id === selectedQueueId) ?? null,
    [queue, selectedQueueId],
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
    setSelectedQueueId(null);
    setError(null);
    setMessage(null);
    setUploading(false);
    setIngesting(false);
  }, []);

  return {
    uploading,
    ingesting,
    chunkLoading,
    error,
    message,
    queue,
    selectedQueueId,
    selectedItem,
    setSelectedQueueId,
    runBatchUploadAndIngest,
    clearQueue,
  };
}