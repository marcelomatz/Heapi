// ─── Domain Types: API Response ───────────────────────────────────────────────

export interface ResponseResult {
  body: string;
  status_code: number;
  duration: number;
  headers: Record<string, string> | string;
}
