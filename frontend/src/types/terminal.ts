// ─── Domain Types: Terminal ────────────────────────────────────────────────────

export interface Shell {
  id: string;
  name: string;
  path: string;
  [key: string]: string; // Allow extra fields return from backend
}

export interface TerminalTab {
  id: string;
  sessionId: string;
  shellId: string;
  shellPath: string;
  name: string;
}

export type LogType = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: LogType;
}
