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
};

export type DocumentChunkItem = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
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