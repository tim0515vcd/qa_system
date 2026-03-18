import { parseErrorMessage } from "@/lib/errors";
import { normalizeApiBase } from "../lib/normalize-api-base";
import type {
  DocumentChunkListResponse,
  IngestDocumentResponse,
  UploadDocumentResponse,
} from "../types/document";

export async function uploadDocument(
  apiBase: string,
  payload: {
    file: File;
    sourceType: "markdown" | "pdf" | "notion";
  },
): Promise<UploadDocumentResponse> {
  const base = normalizeApiBase(apiBase);

  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("source_type", payload.sourceType);

  const response = await fetch(`${base}/api/v1/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<UploadDocumentResponse>;
}

export async function ingestDocument(
  apiBase: string,
  documentId: string,
): Promise<IngestDocumentResponse> {
  const base = normalizeApiBase(apiBase);

  const response = await fetch(`${base}/api/v1/documents/${documentId}/ingest`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<IngestDocumentResponse>;
}

export async function getDocumentChunks(
  apiBase: string,
  documentId: string,
): Promise<DocumentChunkListResponse> {
  const base = normalizeApiBase(apiBase);

  const response = await fetch(`${base}/api/v1/documents/${documentId}/chunks`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<DocumentChunkListResponse>;
}