// ─── Domain Types: Collections & Requests ─────────────────────────────────────
// These mirror the Go models in internal/models/

export interface Request {
  ID: string;
  CollectionID: string;
  name: string;
  method: string;
  url: string;
  headers: string;   // JSON string: KeyValueItem[]
  body: string;
  auth_config: string; // JSON string: AuthConfig
  // Session state (persisted in SQLite via GetCollections enrichment)
  last_response?: string;
  last_status_code?: number;
  last_duration?: number;
  last_headers?: string;
  // In-memory tab state (never persisted, used for active session UX)
  lastResponse?: string;
  lastStatusCode?: number;
  lastDuration?: number;
  lastHeaders?: string;
  // Computed on the frontend from the collection context
  collectionName?: string;
  isDirty?: boolean;
}

export interface Collection {
  ID: string;
  name: string;
  color?: string;
  order: number;
  is_collapsed: boolean;
  requests: Request[];
}

// Parsed auth configuration
export type AuthType = 'none' | 'bearer' | 'basic';

export interface AuthConfig {
  type: AuthType;
  token?: string;     // bearer
  username?: string;  // basic
  password?: string;  // basic
}

// A single key/value row in params or headers editors
export interface KeyValueItem {
  key: string;
  value: string;
  enabled: boolean;
}
