import { http } from "@/lib/http";
import { normalizeApiBase } from "../lib/normalize-api-base";
import type {
  AskQuestionPayload,
  QAResponse,
  SubmitFeedbackPayload,
} from "../types/rag";

export async function askQuestion(
  apiBase: string,
  payload: AskQuestionPayload,
  signal?: AbortSignal,
) {
  const base = normalizeApiBase(apiBase);

  return http<QAResponse>(`${base}/api/v1/qa/ask`, {
    method: "POST",
    json: payload,
    signal,
  });
}

export async function submitFeedback(
  apiBase: string,
  searchQueryId: string,
  payload: SubmitFeedbackPayload,
) {
  const base = normalizeApiBase(apiBase);

  return http<void>(`${base}/api/v1/search/${searchQueryId}/feedback`, {
    method: "POST",
    json: payload,
  });
}