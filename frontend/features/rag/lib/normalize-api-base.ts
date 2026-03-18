export function normalizeApiBase(apiBase: string): string {
  return apiBase.trim().replace(/\/+$/, "");
}