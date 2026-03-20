// ─── Domain Types: Environments ───────────────────────────────────────────────

export interface Environment {
  ID: string;
  name: string;
  variables: string; // JSON string: Record<string, string>
}
