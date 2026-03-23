export type DocumentSourceType = "markdown" | "pdf" | "notion";

export type UploadDocumentResponse = {
  document_id: string;
  title: string;
  source_type: DocumentSourceType;
  status: string;
  created_at: string;
};

export type IngestDocumentResponse = {
  document_id: string;
  chunks_created: number;
  status: string;
  parser_type?: string;
  parser_version?: string;
  content_language?: string;
};

export type DocumentChunkItem = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  section_heading?: string | null;
  heading_level?: number | null;
  chunk_type?: string | null;
  content_language?: string | null;
  page_number: number | null;
  start_offset: number | null;
  end_offset: number | null;
  token_count: number | null;
  created_at: string;
};

export type DocumentChunkListResponse = {
  items: DocumentChunkItem[];
  total: number;
};

export type UploadQueueItemStatus =
  | "idle"
  | "uploading"
  | "ingesting"
  | "success"
  | "error";

export type UploadQueueItem = {
  id: string;
  fileName: string;
  status: UploadQueueItemStatus;
  error: string | null;
  uploadResult: UploadDocumentResponse | null;
  ingestResult: IngestDocumentResponse | null;
  chunksResult: DocumentChunkListResponse | null;
};