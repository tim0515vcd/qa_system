import type { FeedbackReason } from "../types/rag";

export const DEFAULT_QUERY = "VPN 怎麼申請？";
export const DEFAULT_LIMIT = 5;
export const FEEDBACK_REASONS: FeedbackReason[] = [
  "relevant",
  "not_relevant",
  "incomplete",
];