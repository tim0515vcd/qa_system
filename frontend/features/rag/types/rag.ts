export type Citation = {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  document_title: string;
  snippet: string;
  full_content: string;
  matched_by_fts: boolean;
  matched_by_vector: boolean;
  hybrid_score: number;
  created_at: string;
};

export type QAResponse = {
  search_query_id: string;
  query: string;
  answer: string;
  citations: Citation[];
};

export type FeedbackType = "like" | "dislike";
export type FeedbackReason = "relevant" | "not_relevant" | "incomplete";

export type AskQuestionPayload = {
  query: string;
  limit: number;
};

export type SubmitFeedbackPayload = {
  feedback_type: FeedbackType;
  reason: FeedbackReason;
  comment: string | null;
};